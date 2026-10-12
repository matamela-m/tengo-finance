import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Preferences } from './components/Preferences';
import { AppLayout } from './layouts/AppLayout';
import HomePage from './pages/Home';
import PlanPage from './pages/Plan';
import MoneyPage from './pages/Money';
import InboxPage from './pages/Inbox';
import PrivacyPage from './pages/Privacy';
import MePage from './pages/Me';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Preferences />
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
        </Route>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="plan" element={<PlanPage />} />
          <Route path="money" element={<MoneyPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="me" element={<MePage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
