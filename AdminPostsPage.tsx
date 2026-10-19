import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Post, PostCategory, PostStatus } from '../../types';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  AlertTriangle, 
  X,
  FileText
} from 'lucide-react';

export const AdminPostsPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Deletion modal state
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'posts'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      setPosts(list);
    } catch (err) {
      console.error('Error fetching admin posts:', err);
      handleFirestoreError(err, OperationType.GET, 'posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'posts', postToDelete.id));
      toast.success(`"${postToDelete.titleEn || postToDelete.titleUr}" deleted successfully.`);
      setPosts(prev => prev.filter(p => p.id !== postToDelete.id));
      setPostToDelete(null);
    } catch (err) {
      console.error('Error deleting post:', err);
      toast.error('Failed to delete post');
      handleFirestoreError(err, OperationType.DELETE, `posts/${postToDelete.id}`);
    } finally {
      setDeleting(false);
    }
  };

  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      // Category
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      // Status
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      // Search
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const inTitleEn = (p.titleEn || '').toLowerCase().includes(query);
        const inTitleUr = (p.titleUr || '').toLowerCase().includes(query);
        const inSlug = (p.slug || '').toLowerCase().includes(query);
        if (!inTitleEn && !inTitleUr && !inSlug) return false;
      }
      return true;
    }).sort((a, b) => {
      const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : new Date(a.updatedAt || 0).getTime();
      const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : new Date(b.updatedAt || 0).getTime();
      return timeB - timeA;
    });
  }, [posts, search, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6">
      
      {/* Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D9] dark:border-[#2A3138] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold font-serif-literary text-[#14213D] dark:text-[#FAF7F2]">
            Posts & Novel Episodes
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">
            Manage, edit, publish, and review bilingual manuscripts
          </p>
        </div>

        <Link
          to="/admin/posts/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#14213D] hover:bg-[#2D4A73] dark:bg-[#D98E04] text-white text-xs font-semibold shadow-sm transition-all whitespace-nowrap self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Post</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#1A2027] p-4 rounded-[12px] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft flex flex-wrap items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or slug..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/60 dark:bg-[#0F1419]/60 text-[#1A1A1A] dark:text-[#FAF7F2] focus:border-[#D98E04]"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6B7280]">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-white dark:bg-[#0F1419] text-[#14213D] dark:text-[#FAF7F2]"
          >
            <option value="All">All Categories</option>
            <option value="Blog">Blog</option>
            <option value="Article">Article</option>
            <option value="Novel Episode">Novel Episode</option>
          </select>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6B7280]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-white dark:bg-[#0F1419] text-[#14213D] dark:text-[#FAF7F2]"
          >
            <option value="All">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

      </div>

      {/* Posts Table */}
      <div className="bg-white dark:bg-[#1A2027] rounded-[12px] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] dark:bg-[#0F1419] border-b border-[#E8E2D9] dark:border-[#2A3138] text-[#6B7280] dark:text-[#9CA3AF] uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Title</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Language</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Updated</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D9]/60 dark:divide-[#2A3138]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#6B7280]">
                    Loading manuscripts...
                  </td>
                </tr>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-[#FAF7F2]/40 dark:hover:bg-[#0F1419]/40 transition-colors">
                    
                    {/* Title */}
                    <td className="px-5 py-3.5 max-w-[260px]">
                      <div className="font-semibold text-sm text-[#14213D] dark:text-[#FAF7F2] truncate">
                        {post.titleEn || post.titleUr}
                      </div>
                      {post.titleUr && (
                        <div className="font-urdu text-xs text-[#6B7280] truncate">
                          {post.titleUr}
                        </div>
                      )}
                      <div className="text-[11px] text-[#6B7280] font-mono truncate">
                        /{post.slug}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8E2D9]/60 dark:bg-[#2A3138] text-[#14213D] dark:text-[#FAF7F2]">
                        {post.category}
                      </span>
                      {post.category === 'Novel Episode' && post.episodeNumber && (
                        <div className="text-[10px] text-[#D98E04] font-semibold mt-0.5">
                          Episode {post.episodeNumber}
                        </div>
                      )}
                    </td>

                    {/* Language */}
                    <td className="px-5 py-3.5 uppercase font-medium">
                      {post.language === 'both' ? 'Bilingual' : post.language}
                    </td>

                    {/* Status Pill */}
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        post.status === 'published'
                          ? 'bg-[#2F855A]/15 text-[#2F855A]'
                          : 'bg-[#D98E04]/15 text-[#D98E04]'
                      }`}>
                        {post.status}
                      </span>
                    </td>

                    {/* Updated */}
                    <td className="px-5 py-3.5 text-[#6B7280] dark:text-[#9CA3AF]">
                      {post.updatedAt?.toDate ? format(post.updatedAt.toDate(), 'MMM d, yyyy') : 'Recent'}
                    </td>

                    {/* Actions: View, Edit, Delete */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {post.status === 'published' && (
                          <Link
                            to={`/post/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#14213D] hover:bg-[#E8E2D9]/50 transition-colors"
                            title="View live post"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <Link
                          to={`/admin/posts/${post.id}/edit`}
                          className="p-1.5 rounded-lg text-[#14213D] dark:text-[#FAF7F2] hover:bg-[#E8E2D9]/50 transition-colors"
                          title="Edit post"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setPostToDelete(post)}
                          className="p-1.5 rounded-lg text-[#C53030] hover:bg-[#C53030]/10 transition-colors"
                          title="Delete post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#6B7280]">
                    No posts found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#1A2027] rounded-[16px] p-6 border border-[#E8E2D9] dark:border-[#2A3138] shadow-lg space-y-4">
            <div className="flex items-center gap-3 text-[#C53030]">
              <div className="p-2 rounded-full bg-[#C53030]/10">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base font-serif-literary">
                Confirm Manuscript Deletion
              </h3>
            </div>

            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[#14213D] dark:text-white">
                "{postToDelete.titleEn || postToDelete.titleUr}"
              </strong>? This action cannot be reversed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                className="px-4 py-2 rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] text-xs font-semibold text-[#6B7280] hover:text-[#14213D]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePost}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-[#C53030] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Manuscript'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
