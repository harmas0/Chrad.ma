import { HashRouter, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import CreateTask from './pages/CreateTask';
import TaskDetail from './pages/TaskDetail';
import ActiveTask from './pages/ActiveTask';
import RunnerFeed from './pages/RunnerFeed';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import Profile from './pages/Profile';

export default function App() {
  return (
    <HashRouter>
      <div className="app-container bg-dark min-h-screen relative">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateTask />} />
          <Route path="/task/:id" element={<TaskDetail />} />
          <Route path="/active/:id" element={<ActiveTask />} />
          <Route path="/explore" element={<RunnerFeed />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <BottomNav />
      </div>
    </HashRouter>
  );
}
