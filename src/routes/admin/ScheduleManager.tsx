import { useEffect, useState } from 'react';
import { api, type Schedule } from '../../lib/api';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Textarea } from '../../components/Textarea';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

const emptyForm = { time: '', title: '', description: '', sort_order: 0, enabled: 1 };

export function ScheduleManager() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => api.adminGetSchedules().then(setSchedules);

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: schedules.length + 1 });
    setModalOpen(true);
  };

  const openEdit = (item: Schedule) => {
    setEditing(item);
    setForm({
      time: item.time,
      title: item.title,
      description: item.description,
      sort_order: item.sort_order,
      enabled: item.enabled ?? 1,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await api.adminUpdateSchedule(editing.id, form);
      } else {
        await api.adminCreateSchedule(form as Omit<Schedule, 'id'>);
      }
      setModalOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此流程？')) return;
    await api.adminDeleteSchedule(id);
    load();
  };

  const toggleEnabled = async (item: Schedule) => {
    await api.adminUpdateSchedule(item.id, { enabled: item.enabled ? 0 : 1 });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">婚礼流程</h2>
        <Button size="sm" onClick={openCreate}>新增</Button>
      </div>

      <div className="space-y-2">
        {schedules.map((item) => (
          <Card key={item.id} padding="sm">
            <div className="flex items-start justify-between gap-2">
              <div className={item.enabled ? '' : 'opacity-50'}>
                <span className="text-champagne-600 font-medium">{item.time}</span>
                <span className="mx-2">·</span>
                <span className="font-medium">{item.title}</span>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="sm" variant="ghost" onClick={() => toggleEnabled(item)}>
                  {item.enabled ? '隐藏' : '显示'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>编辑</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>删</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑流程' : '新增流程'}>
        <div className="space-y-3">
          <Input label="时间" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="如 12:00" />
          <Input label="标题" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="描述" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="排序" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          <Button fullWidth onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
