import { useEffect, useRef, useState } from 'react';
import { api, ApiError, SITE_MODES, type SiteConfig } from '../../lib/api';
import { resolveEffectiveMode } from '../../lib/mode';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Textarea } from '../../components/Textarea';
import { Button } from '../../components/Button';
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../../lib/date';

export function ConfigEditor() {
  const heroFileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Partial<SiteConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.adminGetConfig().then((cfg) => {
      setForm(cfg);
      setLoading(false);
    });
  }, []);

  const update = (key: keyof SiteConfig, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleHeroUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setMessage('');
    setHeroUploading(true);
    try {
      const result = await api.adminUploadHeroImage(file);
      setForm((prev) => ({ ...prev, hero_image_url: result.hero_image_url }));
      setMessage('背景图上传成功');
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : '背景图上传失败');
    } finally {
      setHeroUploading(false);
      if (heroFileRef.current) heroFileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.adminUpdateConfig(form);
      setMessage('保存成功');
    } catch {
      setMessage('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center text-gray-400 py-12">加载中...</div>;

  return (
    <div className="space-y-4">
      <h2 className="font-medium">网站配置</h2>

      <Card className="space-y-4">
        <Input
          label="站点名称"
          value={form.couple_name || ''}
          onChange={(e) => update('couple_name', e.target.value)}
          placeholder="光影世界"
        />
        <p className="text-xs text-gray-400 -mt-2">
          站点名称用于页脚或品牌展示，例如：光影世界
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Input label="新郎姓名" value={form.groom_name || ''} onChange={(e) => update('groom_name', e.target.value)} />
          <Input label="新娘姓名" value={form.bride_name || ''} onChange={(e) => update('bride_name', e.target.value)} />
        </div>
        <Input
          label="新人展示名"
          value={form.couple_display_name || ''}
          onChange={(e) => update('couple_display_name', e.target.value)}
          placeholder="张三 & 李四"
        />
        <p className="text-xs text-gray-400 -mt-2">
          新人展示名用于首页主标题，留空则自动使用「新郎 & 新娘」
        </p>
        <Input
          label="婚礼日期时间"
          type="datetime-local"
          value={toDatetimeLocalValue(form.wedding_date || '')}
          onChange={(e) => update('wedding_date', fromDatetimeLocalValue(e.target.value))}
        />
        <p className="text-xs text-gray-400 -mt-2">按北京时间（东八区）填写，例如 2026-10-01 12:00</p>
        <Input label="酒店名称" value={form.venue_name || ''} onChange={(e) => update('venue_name', e.target.value)} />
        <Input label="详细地址" value={form.venue_address || ''} onChange={(e) => update('venue_address', e.target.value)} />
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">首页背景图</p>
          {form.hero_image_url ? (
            <div className="overflow-hidden rounded-xl border border-cream-200 bg-cream-50">
              <img
                src={form.hero_image_url}
                alt="首页背景预览"
                className="w-full max-h-48 object-cover"
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400">尚未设置背景图</p>
          )}
          <input
            ref={heroFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleHeroUpload(e.target.files)}
          />
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={heroUploading}
            onClick={() => heroFileRef.current?.click()}
          >
            {heroUploading ? '上传中...' : '上传图片到 R2（推荐）'}
          </Button>
          <p className="text-xs text-gray-400">
            上传后自动获得 HTTPS 地址，用于首页背景和微信分享封面。支持 JPG、PNG、WebP、GIF，最大 10MB。
          </p>
          <Input
            label="或手动填写图片 URL"
            value={form.hero_image_url || ''}
            onChange={(e) => update('hero_image_url', e.target.value)}
            placeholder="https://photos.guangying.world/wedding/hero/..."
          />
        </div>
        <Input label="MV 链接" value={form.mv_url || ''} onChange={(e) => update('mv_url', e.target.value)} placeholder="bilibili / 腾讯视频 / mp4 地址" />
        <Input label="MV 封面 URL" value={form.mv_cover_url || ''} onChange={(e) => update('mv_cover_url', e.target.value)} />
        <Input label="照片直播链接" value={form.photo_live_url || ''} onChange={(e) => update('photo_live_url', e.target.value)} />
        <Input label="高德地图链接" value={form.amap_url || ''} onChange={(e) => update('amap_url', e.target.value)} placeholder="留空则自动生成" />
        <Input label="百度地图链接" value={form.baidu_map_url || ''} onChange={(e) => update('baidu_map_url', e.target.value)} />
        <Input label="腾讯地图链接" value={form.tencent_map_url || ''} onChange={(e) => update('tencent_map_url', e.target.value)} />
        <Textarea label="着装建议" value={form.dress_code || ''} onChange={(e) => update('dress_code', e.target.value)} />
        <Textarea label="注意事项" value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} />
        <div className="rounded-xl border border-cream-200 bg-cream-50 px-4 py-3">
          <p className="text-sm font-medium text-gray-700">网站模式</p>
          <p className="mt-1 text-sm text-champagne-600">
            {SITE_MODES[resolveEffectiveMode(form.wedding_date || '')]}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            根据婚礼日期（北京时间）自动切换：婚礼日前为婚前模式，当天为婚礼当天，之后为婚后模式
          </p>
        </div>
      </Card>

      {message && <p className={`text-sm ${message.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>{message}</p>}
      <Button fullWidth onClick={handleSave} disabled={saving}>
        {saving ? '保存中...' : '保存配置'}
      </Button>
    </div>
  );
}
