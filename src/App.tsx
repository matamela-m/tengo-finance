import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Preferences } from './components/Preferences';
import { PersonaProvider } from './data/PersonaProvider';
import { AppGate } from './layouts/AppGate';
import Landing from './pages/Landing';
import Picker from './pages/Picker';
import Consent from './pages/Consent';
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
      <PersonaProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/start" element={<Picker />} />
          <Route path="/consent" element={<Consent />} />
          <Route path="/app" element={<AppGate />}>
            <Route index element={<HomePage />} />
            <Route path="plan" element={<PlanPage />} />
            <Route path="money" element={<MoneyPage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="privacy/*" element={<PrivacyPage />} />
            <Route path="me" element={<MePage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PersonaProvider>
    </BrowserRouter>
  );
}
