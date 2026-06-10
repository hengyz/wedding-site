import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import {
  RSVP_ATTENDANCE_OPTIONS,
  RSVP_STORAGE_KEY,
  RSVP_TRANSPORT_OPTIONS,
  type RsvpAttendance,
  type RsvpTransportType,
} from '../lib/rsvp';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export function RsvpPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [attendance, setAttendance] = useState<RsvpAttendance | ''>('');
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [arrivalTime, setArrivalTime] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [transportType, setTransportType] = useState<RsvpTransportType | ''>('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    setAlreadySubmitted(localStorage.getItem(RSVP_STORAGE_KEY) === 'true');
  }, []);

  const showDetails = attendance === 'yes' || attendance === 'maybe';
  const showPickup = showDetails && transportType === 'need_pickup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!name.trim()) {
      setError('请填写姓名');
      return;
    }
    if (!attendance) {
      setError('请选择是否参加');
      return;
    }
    if (showDetails && (adultCount < 0 || adultCount > 10)) {
      setError('成人数需在 0-10 之间');
      return;
    }
    if (showPickup && !pickupLocation.trim()) {
      setError('请填写接站地点');
      return;
    }

    setLoading(true);
    try {
      const res = await api.submitRsvp({
        name: name.trim(),
        phone: phone.trim() || undefined,
        attendance,
        adultCount: showDetails ? adultCount : undefined,
        childCount: showDetails ? childCount : undefined,
        arrivalTime: showDetails && arrivalTime ? arrivalTime : undefined,
        departureTime: showDetails && departureTime ? departureTime : undefined,
        transportType: showDetails && transportType ? transportType : undefined,
        pickupLocation: showPickup ? pickupLocation.trim() : undefined,
        remark: remark.trim() || undefined,
      });
      setMessage(res.message);
      localStorage.setItem(RSVP_STORAGE_KEY, 'true');
      setAlreadySubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <header className="mb-6 text-center">
        <h1 className="section-title mb-2">赴宴回执</h1>
        <p className="text-sm leading-relaxed text-gray-500">
          为了更好地安排座位、接待和交通，请您填写赴宴信息。
        </p>
      </header>

      {alreadySubmitted && !message && (
        <Card className="mb-4 border-champagne-400/40 bg-cream-100/80">
          <p className="text-sm text-champagne-600">
            您已提交过回执，如需修改请重新提交。
          </p>
        </Card>
      )}

      <Card className="mb-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="姓名 *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入您的姓名"
            maxLength={20}
          />

          <Input
            label="手机号"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="便于我们联系您（选填）"
            maxLength={20}
          />

          <fieldset>
            <legend className="mb-3 block text-sm font-medium text-gray-700">
              是否参加 *
            </legend>
            <div className="grid gap-3">
              {RSVP_ATTENDANCE_OPTIONS.map((opt) => {
                const selected = attendance === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`rsvp-option-card ${selected ? 'rsvp-option-card-active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="attendance"
                      value={opt.value}
                      checked={selected}
                      onChange={() => setAttendance(opt.value)}
                      className="sr-only"
                    />
                    <span className="text-xl">{opt.icon}</span>
                    <span className="flex-1">
                      <span className="block font-medium text-gray-800">{opt.label}</span>
                      <span className="mt-0.5 block text-xs text-gray-500">{opt.desc}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {showDetails && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="成人数 *"
                  type="number"
                  min={0}
                  max={10}
                  value={adultCount}
                  onChange={(e) => setAdultCount(Number(e.target.value))}
                />
                <Input
                  label="儿童数"
                  type="number"
                  min={0}
                  max={10}
                  value={childCount}
                  onChange={(e) => setChildCount(Number(e.target.value))}
                />
              </div>

              <Input
                label="抵达时间"
                type="datetime-local"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
              />

              <Input
                label="离开时间"
                type="datetime-local"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
              />

              <fieldset>
                <legend className="mb-3 block text-sm font-medium text-gray-700">
                  交通方式
                </legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {RSVP_TRANSPORT_OPTIONS.map((opt) => {
                    const selected = transportType === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`rsvp-transport-chip ${selected ? 'rsvp-transport-chip-active' : ''}`}
                      >
                        <input
                          type="radio"
                          name="transport"
                          value={opt.value}
                          checked={selected}
                          onChange={() => setTransportType(opt.value)}
                          className="sr-only"
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {showPickup && (
                <Input
                  label="接站地点 *"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="高铁站 / 机场 / 酒店 / 具体地址"
                  maxLength={100}
                />
              )}
            </>
          )}

          <Textarea
            label="备注"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="忌口、老人小孩、特殊安排等（选填）"
            maxLength={200}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? '提交中...' : '提交回执'}
          </Button>

          <p className="text-center text-xs leading-relaxed text-gray-400">
            您填写的信息仅用于婚礼接待、座位和交通安排，不会公开展示。
          </p>
        </form>
      </Card>
    </div>
  );
}
