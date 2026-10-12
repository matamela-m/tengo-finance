import { Route, Routes } from 'react-router-dom';
import Overview from './privacy/Overview';
import MyData from './privacy/MyData';
import Audit from './privacy/Audit';
import Review from './privacy/Review';
import Breach from './privacy/Breach';
import Delete from './privacy/Delete';
import NotFound from './NotFound';

export default function PrivacyPage() {
  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path="data" element={<MyData />} />
      <Route path="audit" element={<Audit />} />
      <Route path="review" element={<Review />} />
      <Route path="breach" element={<Breach />} />
      <Route path="delete" element={<Delete />} />
      <Route path="*" element={<NotFound embedded />} />
    </Routes>
  );
}
