import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { db, handleFirestoreError, OperationType, seedSampleDataIfNeeded } from '../../lib/firebase';
import { Post, Series } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, 
  CheckCircle2, 
  FileEdit, 
  Layers, 
  PlusCircle, 
  ArrowUpRight, 
  Clock, 
  Sparkles,
  BookOpen,
  KeyRound
} from 'lucide-react';
import { toast } from 'sonner';
import { ChangePasswordModal } from '../../components/ChangePasswordModal';

export const AdminDashboard: React.FC = () => {
  const { user, adminEmail } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const fetchStatsAndPosts = async () => {
    setLoading(true);
    try {
      const postsSnap = await getDocs(collection(db, 'posts'));
      const allPosts: Post[] = postsSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Post));
      setPosts(allPosts);

      const seriesSnap = await getDocs(collection(db, 'series'));
      const allSeries: Series[] = seriesSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Series));
      setSeriesList(allSeries);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      handleFirestoreError(err, OperationType.GET, 'posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndPosts();
  }, []);

  const totalPosts = posts.length;
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;
  const seriesCount = seriesList.length;

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await seedSampleDataIfNeeded(user?.uid, user?.displayName || user?.email || 'Admin');
      toast.success('Sample bilingual posts and novel series seeded successfully!');
      await fetchStatsAndPosts();
    } catch (e) {
      toast.error('Failed to seed sample data');
    } finally {
      setSeeding(false);
    }
  };

  const recentPosts = [...posts].sort((a, b) => {
    const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : new Date(a.updatedAt || 0).getTime();
    const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : new Date(b.updatedAt || 0).getTime();
    return timeB - timeA;
  }).slice(0, 5);

  return (
    <div className="space-y-8">
      
      {/* Header & Quick Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D9] dark:border-[#2A3138] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold font-serif-literary text-[#14213D] dark:text-[#FAF7F2]">
            InkBridge Admin
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">
            Logged in as <span className="font-semibold text-[#14213D] dark:text-[#FAF7F2]">{adminEmail || user?.email || 'Administrator'}</span>
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/posts/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#14213D] hover:bg-[#2D4A73] dark:bg-[#D98E04] text-white text-xs font-semibold shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Post</span>
          </Link>

          <Link
            to="/admin/posts/new?category=Novel%20Episode"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-white dark:bg-[#1A2027] hover:bg-[#FAF7F2] text-xs font-semibold text-[#14213D] dark:text-[#FAF7F2] shadow-xs transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-[#D98E04]" />
            <span>New Episode</span>
          </Link>

          <Link
            to="/admin/series"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-white dark:bg-[#1A2027] hover:bg-[#FAF7F2] text-xs font-semibold text-[#14213D] dark:text-[#FAF7F2] shadow-xs transition-all"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Manage Series</span>
          </Link>

          <button
            type="button"
            onClick={() => setPasswordModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-white dark:bg-[#1A2027] hover:bg-[#FAF7F2] text-xs font-semibold text-[#6B7280] hover:text-[#14213D] dark:hover:text-white shadow-xs transition-all"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#D98E04]" />
            <span>Passcode</span>
          </button>
        </div>
      </div>

      {/* Stat Cards (Total posts, Published, Drafts, Series count) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Posts */}
        <div className="p-5 rounded-[12px] bg-white dark:bg-[#1A2027] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-[#6B7280] dark:text-[#9CA3AF]">
            <span className="text-xs font-medium uppercase tracking-wider">Total Works</span>
            <FileText className="w-4 h-4 text-[#14213D] dark:text-[#F5D88F]" />
          </div>
          <div className="text-3xl font-semibold font-serif-literary text-[#14213D] dark:text-[#FAF7F2]">
            {loading ? '—' : totalPosts}
          </div>
          <p className="text-[11px] text-[#6B7280]">All published and draft items</p>
        </div>

        {/* Published */}
        <div className="p-5 rounded-[12px] bg-white dark:bg-[#1A2027] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-[#6B7280] dark:text-[#9CA3AF]">
            <span className="text-xs font-medium uppercase tracking-wider">Published</span>
            <CheckCircle2 className="w-4 h-4 text-[#2F855A]" />
          </div>
          <div className="text-3xl font-semibold font-serif-literary text-[#2F855A]">
            {loading ? '—' : publishedCount}
          </div>
          <p className="text-[11px] text-[#6B7280]">Live for public readership</p>
        </div>

        {/* Drafts */}
        <div className="p-5 rounded-[12px] bg-white dark:bg-[#1A2027] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-[#6B7280] dark:text-[#9CA3AF]">
            <span className="text-xs font-medium uppercase tracking-wider">Drafts</span>
            <FileEdit className="w-4 h-4 text-[#D98E04]" />
          </div>
          <div className="text-3xl font-semibold font-serif-literary text-[#D98E04]">
            {loading ? '—' : draftCount}
          </div>
          <p className="text-[11px] text-[#6B7280]">Unpublished manuscripts</p>
        </div>

        {/* Series Count */}
        <div className="p-5 rounded-[12px] bg-white dark:bg-[#1A2027] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-[#6B7280] dark:text-[#9CA3AF]">
            <span className="text-xs font-medium uppercase tracking-wider">Novel Series</span>
            <Layers className="w-4 h-4 text-[#2D4A73]" />
          </div>
          <div className="text-3xl font-semibold font-serif-literary text-[#14213D] dark:text-[#FAF7F2]">
            {loading ? '—' : seriesCount}
          </div>
          <p className="text-[11px] text-[#6B7280]">Serialized storytelling hubs</p>
        </div>

      </div>

      {/* If database is empty, provide one-click seed button */}
      {totalPosts === 0 && !loading && (
        <div className="p-6 rounded-[12px] bg-[#F5D88F]/20 dark:bg-[#D98E04]/10 border border-[#D98E04]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-[#14213D] dark:text-[#FAF7F2] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D98E04]" />
              <span>Empty Library Detected</span>
            </h3>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              Initialize the database with the 3 sample bilingual stories and "The Bridge" novel series.
            </p>
          </div>
          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="px-4 py-2 rounded-lg bg-[#D98E04] text-white text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shadow-xs"
          >
            {seeding ? 'Seeding Stories...' : 'Seed Sample Content'}
          </button>
        </div>
      )}

      {/* Recent Posts Table Preview */}
      <div className="bg-white dark:bg-[#1A2027] rounded-[12px] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft overflow-hidden space-y-4">
        <div className="p-5 border-b border-[#E8E2D9] dark:border-[#2A3138] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold font-serif-literary text-[#14213D] dark:text-[#FAF7F2]">
              Recent Editorial Submissions
            </h2>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              Latest created or updated literary manuscripts
            </p>
          </div>
          <Link
            to="/admin/posts"
            className="text-xs font-semibold text-[#D98E04] hover:underline flex items-center gap-1"
          >
            <span>View All Posts</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2]/80 dark:bg-[#0F1419]/80 border-b border-[#E8E2D9] dark:border-[#2A3138] text-[#6B7280] dark:text-[#9CA3AF] uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Title & Script</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Language</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Updated</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D9]/60 dark:divide-[#2A3138]">
              {recentPosts.map((post) => (
                <tr key={post.id} className="hover:bg-[#FAF7F2]/40 dark:hover:bg-[#0F1419]/40 transition-colors">
                  <td className="px-5 py-3.5 max-w-[280px]">
                    <div className="font-semibold text-sm text-[#14213D] dark:text-[#FAF7F2] truncate">
                      {post.titleEn || post.titleUr}
                    </div>
                    {post.titleUr && (
                      <div className="font-urdu text-xs text-[#6B7280] dark:text-[#9CA3AF] truncate">
                        {post.titleUr}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8E2D9]/60 dark:bg-[#2A3138] text-[#14213D] dark:text-[#FAF7F2]">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 uppercase font-medium">
                    {post.language}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      post.status === 'published'
                        ? 'bg-[#2F855A]/15 text-[#2F855A]'
                        : 'bg-[#D98E04]/15 text-[#D98E04]'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#6B7280] dark:text-[#9CA3AF]">
                    {post.updatedAt?.toDate ? format(post.updatedAt.toDate(), 'MMM d, yyyy') : 'Recently'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      to={`/admin/posts/${post.id}/edit`}
                      className="px-2.5 py-1 rounded bg-[#14213D] text-white hover:bg-[#2D4A73] transition-colors"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />

    </div>
  );
};
