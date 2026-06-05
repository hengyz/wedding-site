import { useEffect, useRef, useState } from 'react';
import { api, ApiError, PHOTO_CATEGORIES, type Photo } from '../../lib/api';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

const emptyForm = {
  url: '',
  thumbnail_url: '',
  category: 'pre_wedding',
  title: '',
  sort_order: 0,
  enabled: 1,
};

export function PhotoManager() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Photo | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('pre_wedding');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  const load = () => api.adminGetPhotos().then(setPhotos);

  useEffect(() => { load(); }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadMsg('');
    setUploading(true);
    let success = 0;
    try {
      for (const file of Array.from(files)) {
        await api.adminUploadPhoto(file, { category: uploadCategory });
        success += 1;
      }
      setUploadMsg(`成功上传 ${success} 张`);
      load();
    } catch (err) {
      setUploadMsg(err instanceof ApiError ? err.message : '上传失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: photos.length + 1 });
    setModalOpen(true);
  };

  const openEdit = (item: Photo) => {
    setEditing(item);
    setForm({
      url: item.url,
      thumbnail_url: item.thumbnail_url,
      category: item.category,
      title: item.title,
      sort_order: item.sort_order,
      enabled: item.enabled ?? 1,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.url.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.adminUpdatePhoto(editing.id, form);
      } else {
        await api.adminCreatePhoto(form as Omit<Photo, 'id'>);
      }
      setModalOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此照片？')) return;
    await api.adminDeletePhoto(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">相册管理</h2>
        <Button size="sm" variant="secondary" onClick={openCreate}>手动填 URL</Button>
      </div>

      <Card className="space-y-3">
        <p className="text-sm font-medium text-champagne-600">上传图片到 R2</p>
        <div>
          <label className="block text-sm text-gray-600 mb-1">分类</label>
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className="w-full rounded-xl border border-cream-200 px-4 py-2.5 text-base"
          >
            {Object.entries(PHOTO_CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <Button
          fullWidth
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? '上传中...' : '选择图片上传'}
        </Button>
        <p className="text-xs text-gray-400">支持 JPG/PNG/WebP/GIF，单张最大 10MB，可多选</p>
        {uploadMsg && (
          <p className={`text-sm ${uploadMsg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
            {uploadMsg}
          </p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo) => (
          <Card key={photo.id} padding="sm" className={photo.enabled ? '' : 'opacity-50'}>
            <img
              src={photo.thumbnail_url || photo.url}
              alt={photo.title}
              className="w-full aspect-square object-cover rounded-lg mb-2"
            />
            <p className="text-xs truncate">{photo.title || '无标题'}</p>
            <p className="text-xs text-gray-400">{PHOTO_CATEGORIES[photo.category] || photo.category}</p>
            <div className="flex gap-1 mt-2">
              <Button size="sm" variant="secondary" onClick={() => openEdit(photo)}>编辑</Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(photo.id)}>删</Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑照片' : '手动添加 URL'}>
        <div className="space-y-3">
          <Input label="图片 URL *" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          <Input label="缩略图 URL" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="留空则使用原图" />
          <Input label="标题" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-cream-200 px-4 py-2.5"
            >
              {Object.entries(PHOTO_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <Input label="排序" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          <Button fullWidth onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
