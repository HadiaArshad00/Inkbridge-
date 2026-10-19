import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  addDoc,
  updateDoc,
  deleteDoc,
  collection, 
  query, 
  where, 
  orderBy, 
  getDocFromServer,
  serverTimestamp 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { Post, Series } from '../types';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client appears offline. Retrying or working in cached mode.");
    }
  }
}
testConnection();

// Initial seed data defined in requirements:
// 1. English blog post "Welcome to InkBridge"
// 2. Urdu blog post "خوش آمدید"
// 3. English novel episode "The Bridge — Episode 1"
// Also seed one series "The Bridge" with the episode above linked to it.
export async function seedSampleDataIfNeeded(currentUserId?: string, currentUserName?: string) {
  // Check if an authenticated user exists; public readers cannot write to Firestore under security rules
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return; // Non-admin/public users must not attempt writes
  }

  const authorId = currentUserId || currentUser.uid;
  const authorName = currentUserName || currentUser.displayName || currentUser.email?.split('@')[0] || 'InkBridge Editorial';

  try {
    const postsRef = collection(db, 'posts');
    const existingSnap = await getDocs(query(postsRef));
    if (!existingSnap.empty) {
      return; // Already seeded
    }

    // Seed Series first
    const seriesRef = collection(db, 'series');
    const seriesDoc = await addDoc(seriesRef, {
      nameEn: 'The Bridge',
      nameUr: 'پل',
      descriptionEn: 'A tale connecting two worlds across forgotten rivers, whispering ancient memories in two languages.',
      descriptionUr: 'دو زبانوں اور گمشدہ دریاؤں کے پار جڑی ایک پرکشش داستان جو دلوں کو ملاتی ہے۔',
      coverImageUrl: 'https://images.unsplash.com/photo-1545659328-941c42f06797?auto=format&fit=crop&w=1200&q=80',
      language: 'both',
      createdAt: serverTimestamp(),
    });

    const seriesId = seriesDoc.id;

    // 1. English blog post "Welcome to InkBridge"
    await addDoc(postsRef, {
      titleEn: 'Welcome to InkBridge',
      titleUr: 'انک برج میں خوش آمدید',
      slug: 'welcome-to-inkbridge',
      excerptEn: 'Discover a haven for literature where English and Urdu narratives stand side by side, woven by one shared passion.',
      excerptUr: 'ادب کا ایک ایسا ٹھکانہ جہاں انگریزی اور اردو کی تحریریں ایک ساتھ سانس لیتی ہیں۔',
      contentEn: `## Where Words Build Arches\n\nLanguage has always been more than grammar and phonetics — it is the vessel of human memory, longing, and imagination. In an era of fragmented digital streams, **InkBridge** is conceived as a sanctuary for longform literature, reflective essays, and serialized novels.\n\n> "Two languages. One story."\n\nHere, the precision of English and the profound lyrical resonance of Urdu meet not in conflict, but in seamless dialogue. Whether you are delving into a contemporary fiction series, exploring cultural critique, or immersing yourself in classical Nastaliq poetry, we invite you to take your time.\n\n### What You Will Find Here\n\n* **Serialized Novels:** Chapter-by-chapter reading experiences formatted for comfortable contemplation.\n* **Essays & Commentary:** Thoughtful perspectives on culture, translation, and literary heritage.\n* **Bilingual Storytelling:** Direct side-by-side or dual-script presentation preserving the authenticity of both traditions.\n\n*Read slowly. Think deeply.*`,
      contentUr: `## جہاں الفاظ پل بناتے ہیں\n\nزبان محض الفاظ کا مجموعہ نہیں بلکہ انسانی احساسات، یادوں اور خوابوں کی امین ہے۔ انک برج ایک ادبی گوشہ ہے جہاں انگریزی اور اردو کہانیاں ایک ہی چھت تلے جمع ہیں۔\n\n> دو زبانیں، ایک کہانی۔\n\nہم آپ کو اس خوبصورت سفر میں خوش آمدید کہتے ہیں۔`,
      category: 'Blog',
      seriesId: null,
      episodeNumber: null,
      language: 'both',
      coverImageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
      status: 'published',
      readingTimeMinutes: 3,
      authorId: authorId,
      authorName: authorName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Urdu blog post "خوش آمدید"
    await addDoc(postsRef, {
      titleEn: 'A Warm Welcome to Readers',
      titleUr: 'خوش آمدید — دو زبانوں کا سنگم',
      slug: 'khush-amdeed',
      excerptEn: 'An inaugural reflection on celebrating the beauty, depth, and cadence of the Urdu literary tradition.',
      excerptUr: 'اردو زبان کی لطافت، نستعلیق کی خوبصورتی اور دلی جذبات کا ایک انوکھا ادبی سفر۔',
      contentEn: `## The Elegance of Urdu Literature\n\nUrdu carries within its cadence centuries of poetic wonder, philosophical depth, and delicate expression. InkBridge is dedicated to giving Urdu readers a modern, distraction-free typographic experience in authentic Nastaliq script.`,
      contentUr: `## دو زبانوں کا سنگم\n\nاردو زبان و ادب کی تاریخ بے پناہ لطافت، فکری گہرائی اور قلبی احساسات سے مالا مال ہے۔ انک برج کی بنیاد اس یقین پر رکھی گئی ہے کہ کہانیاں سرحدوں اور زبانوں کی قید سے آزاد ہوتی ہیں۔\n\nنستعلیق رسم الخط میں لکھے گئے ہر لفظ میں ایک خاص ترنم اور وقار پنہاں ہے۔ یہاں ہم آپ کے لیے لائے ہیں:\n\n* **سلسلہ وار ناولز:** قسط وار دلچسپ کہانیاں جو آپ کو اپنے سحر میں جکڑ لیں۔\n* **فکری مضامین:** ادب، تاریخ اور جدید معاشرت پر بصیرت افروز تجزیے۔\n* **خالص ادبی تجربہ:** آنکھوں کو راحت بخشنے والا نستعلیق فونٹ اور صاف ستھرا ڈیزائن۔\n\nہمیں امید ہے کہ انک برج کا یہ مسکن آپ کے ادبی ذوق کی تسکین کا سبب بنے گا۔`,
      category: 'Blog',
      seriesId: null,
      episodeNumber: null,
      language: 'ur',
      coverImageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
      status: 'published',
      readingTimeMinutes: 4,
      authorId: authorId,
      authorName: authorName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 3. English novel episode "The Bridge — Episode 1"
    await addDoc(postsRef, {
      titleEn: 'The Bridge — Episode 1: The Crossing',
      titleUr: 'پل — قسط ۱: گزرگاہ',
      slug: 'the-bridge-episode-1',
      excerptEn: 'The fog lifted at dawn over the river Chenab, revealing the rusted archway nobody remembered building.',
      excerptUr: 'صبح کی دھند میں ایک پرانا محرابی پل نمودار ہوا جس کی یادیں تاریخ کے ورقوں میں کہیں گم تھیں۔',
      contentEn: `### Chapter One: The Whispers in the Mist\n\nThe iron arches of the bridge groaned under the pre-dawn moisture, a metallic sigh that echoed through the river valley. Farhan pulled his wool shawl closer around his shoulders, watching the mist roll off the waters of the Chenab.\n\nFor seventy years, the village elders had warned the young never to cross after midnight. Not because of bandits or crumbling stone, but because of what the wind carried from the opposite bank — half-remembered verses sung in a dialect no one spoke anymore.\n\nHe pulled out the brass key his grandfather had left in a velvet pouch. Engraved on its side were two lines:\n\n*“One foot in Lahore, one eye on the sea,*  \n*The words that we leave are the bridges we be.”*\n\nHe took his first step upon the wet wooden planks. The river below rushed silently, dark as spilled ink.`,
      contentUr: `### باب اول: کہرے کی سرگوشیاں\n\nپرانے لوہے کی محرابوں سے رات کی نمی ٹپک رہی تھی۔ دور چناب کی لہریں ایک خاموش سحر میں ڈوبی ہوئی تھیں۔ فرحان نے اپنی اونی شال کو کندھوں پر سمیٹتے ہوئے نگاہیں سامنے اٹھائیں۔\n\nدادا جان کی وصیت یاد آئی: "الفاظ محض سیاہی نہیں ہوتے، یہ وہ پل ہیں جو بچھڑے ہوئے زمانوں کو ملا دیتے ہیں۔"\n\nاس نے لکڑی کے تختے پر پہلا قدم رکھا، اور دریا نیچے سیاہ روشنائی کی طرح بہہ رہا تھا۔`,
      category: 'Novel Episode',
      seriesId: seriesId,
      episodeNumber: 1,
      language: 'both',
      coverImageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      status: 'published',
      readingTimeMinutes: 5,
      authorId: authorId,
      authorName: authorName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

  } catch (err) {
    console.error('Error seeding sample data:', err);
    throw err;
  }
}
