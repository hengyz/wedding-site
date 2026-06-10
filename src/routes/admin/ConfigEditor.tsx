import { useEffect, useState } from 'react';
import { api, SITE_MODES, type SiteConfig } from '../../lib/api';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Textarea } from '../../components/Textarea';
import { Button } from '../../components/Button';

export function ConfigEditor() {
  const [form, setForm] = useState<Partial<SiteConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
          value={form.wedding_date?.slice(0, 16) || ''}
          onChange={(e) => update('wedding_date', e.target.value ? new Date(e.target.value).toISOString() : '')}
        />
        <Input label="酒店名称" value={form.venue_name || ''} onChange={(e) => update('venue_name', e.target.value)} />
        <Input label="宴会厅" value={form.venue_hall || ''} onChange={(e) => update('venue_hall', e.target.value)} placeholder="三层国际宴会厅" />
        <Input label="详细地址" value={form.venue_address || ''} onChange={(e) => update('venue_address', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="签到时间" value={form.check_in_time || ''} onChange={(e) => update('check_in_time', e.target.value)} placeholder="10:30" />
          <Input label="仪式时间" value={form.ceremony_time || ''} onChange={(e) => update('ceremony_time', e.target.value)} placeholder="11:18" />
        </div>
        <Input label="停车信息" value={form.parking_info || ''} onChange={(e) => update('parking_info', e.target.value)} placeholder="酒店地下停车场，可凭车牌免费停车" />
        <Input label="首页背景图" value={form.hero_image_url || ''} onChange={(e) => update('hero_image_url', e.target.value)} />
        <Input label="MV 链接" value={form.mv_url || ''} onChange={(e) => update('mv_url', e.target.value)} placeholder="bilibili / 腾讯视频 / mp4 地址" />
        <Input label="MV 封面 URL" value={form.mv_cover_url || ''} onChange={(e) => update('mv_cover_url', e.target.value)} />
        <Input label="照片直播链接" value={form.photo_live_url || ''} onChange={(e) => update('photo_live_url', e.target.value)} />
        <Input label="高德地图链接" value={form.amap_url || ''} onChange={(e) => update('amap_url', e.target.value)} placeholder="留空则自动生成" />
        <Input label="百度地图链接" value={form.baidu_map_url || ''} onChange={(e) => update('baidu_map_url', e.target.value)} />
        <Input label="腾讯地图链接" value={form.tencent_map_url || ''} onChange={(e) => update('tencent_map_url', e.target.value)} />
        <Textarea label="着装建议" value={form.dress_code || ''} onChange={(e) => update('dress_code', e.target.value)} />
        <Textarea label="注意事项" value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">网站模式</label>
          <select
            value={form.mode || 'before_wedding'}
            onChange={(e) => update('mode', e.target.value)}
            className="w-full rounded-xl border border-cream-200 px-4 py-2.5"
          >
            {Object.entries(SITE_MODES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </Card>

      {message && <p className={`text-sm ${message.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>{message}</p>}
      <Button fullWidth onClick={handleSave} disabled={saving}>
        {saving ? '保存中...' : '保存配置'}
      </Button>
    </div>
  );
}
