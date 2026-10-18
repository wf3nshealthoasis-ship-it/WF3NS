import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { getRoomBadgeStyle } from '../utils/themeConfig.ts';

interface Props {
  rooms: string[];
  selectedRoom: string;
  onSelectRoom: (room: string) => void;
  roomCounts: Record<string, number>;
  onAddNewRoom: (roomName: string) => void;
}

export const RoomTabs: React.FC<Props> = ({
  rooms,
  selectedRoom,
  onSelectRoom,
  roomCounts,
  onAddNewRoom,
}) => {
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim()) return;
    const formatted = newRoomNumber.toUpperCase().startsWith('RM')
      ? newRoomNumber.toUpperCase().trim()
      : `RM ${newRoomNumber.trim()}`;
    onAddNewRoom(formatted);
    onSelectRoom(formatted);
    setNewRoomNumber('');
    setIsAddingRoom(false);
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin text-xs">
      {/* All Rooms Tab */}
      <button
        onClick={() => onSelectRoom('ALL')}
        className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 shadow-2xs ${
          selectedRoom === 'ALL'
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shadow-xs ring-2 ring-indigo-200'
            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
        }`}
      >
        <span>All Ward F3</span>
        <span
          className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold ${
            selectedRoom === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {roomCounts['ALL'] || 0}
        </span>
      </button>

      {/* Individual Room Tabs with High-Contrast Badge Styling */}
      {rooms.map((room) => {
        const count = roomCounts[room] || 0;
        const isSelected = selectedRoom === room;
        return (
          <button
            key={room}
            onClick={() => onSelectRoom(room)}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 shadow-2xs ${
              isSelected
                ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                : 'bg-white text-slate-700 hover:bg-blue-50/60 hover:text-blue-900 border border-slate-200 hover:border-blue-200'
            }`}
          >
            <span>{room}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                isSelected ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}

      {/* Add Room Control */}
      {isAddingRoom ? (
        <form onSubmit={handleAddSubmit} className="flex items-center gap-1 shrink-0 bg-white p-1 rounded-lg border border-blue-400 shadow-xs">
          <input
            type="text"
            value={newRoomNumber}
            onChange={(e) => setNewRoomNumber(e.target.value)}
            placeholder="e.g. 395"
            autoFocus
            className="w-20 px-2 py-0.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded focus:outline-hidden text-slate-900"
          />
          <button
            type="submit"
            className="px-2.5 py-0.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setIsAddingRoom(false)}
            className="px-1.5 py-0.5 text-slate-400 hover:text-slate-600 rounded text-xs"
          >
            ✕
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsAddingRoom(true)}
          className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-blue-700 hover:bg-blue-50/70 rounded-lg transition-colors border border-dashed border-slate-300 hover:border-blue-400 flex items-center gap-1 shrink-0 shadow-2xs"
          title="Add a new room to Ward F3"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Room</span>
        </button>
      )}
    </div>
  );
};
