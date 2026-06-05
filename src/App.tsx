import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './components/PublicLayout';
import { AdminLayout } from './components/AdminLayout';
import { Home } from './routes/Home';
import { Wedding } from './routes/Wedding';
import { MapPage } from './routes/Map';
import { Gallery } from './routes/Gallery';
import { Video } from './routes/Video';
import { Live } from './routes/Live';
import { BlessingPage } from './routes/Blessing';
import { AdminLogin } from './routes/admin/Login';
import { AdminDashboard } from './routes/admin/Dashboard';
import { ConfigEditor } from './routes/admin/ConfigEditor';
import { ScheduleManager } from './routes/admin/ScheduleManager';
import { PhotoManager } from './routes/admin/PhotoManager';
import { BlessingManager } from './routes/admin/BlessingManager';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/wedding" element={<Wedding />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/video" element={<Video />} />
          <Route path="/live" element={<Live />} />
          <Route path="/blessing" element={<BlessingPage />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="config" element={<ConfigEditor />} />
          <Route path="schedules" element={<ScheduleManager />} />
          <Route path="photos" element={<PhotoManager />} />
          <Route path="blessings" element={<BlessingManager />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
