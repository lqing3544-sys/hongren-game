import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";
import StartPage from "@/pages/StartPage/StartPage";
import DashboardPage from "@/pages/DashboardPage/DashboardPage";
import PublishPage from "@/pages/PublishPage/PublishPage";
import PartnershipPage from "@/pages/PartnershipPage/PartnershipPage";
import CommunityPage from "@/pages/CommunityPage/CommunityPage";
import CrisisPage from "@/pages/CrisisPage/CrisisPage";
import MessagesPage from "@/pages/MessagesPage/MessagesPage";
import SettingsPage from "@/pages/SettingsPage/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="start" element={<StartPage />} />
        <Route path="publish" element={<PublishPage />} />
        <Route path="partnership" element={<PartnershipPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="crisis" element={<CrisisPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
