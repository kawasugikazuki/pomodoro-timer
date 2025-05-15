import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const workTime =  5;
  const breakTime = 5 * 60;
  const longBreakTime = 20 * 60;
  const resetBeforeLongBreak = 4;
  const [phase, setPhase] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(workTime);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement>(new Audio('/ほんわかぷっぷー.mp3'));
  const [cycleCount, setCycleCount] = useState(0);
  const [workingMembers, setWorkingMembers] = useState<string[]>([]);
  const [memberName, setMemberName] = useState('');



  // 時間のフォーマット関数（mm:ss）
  const formatTime = (seconds: number) => {
    const min = String(Math.floor(seconds / 60)).padStart(2, '0');
    const sec = String(seconds % 60).padStart(2, '0');
    return `${min}:${sec}`;
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() =>{
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }else if ( timeLeft === 0) {
      setIsRunning(false);
      if (phase === 'work') {
        const newCycleCount = cycleCount + 1;
        setCycleCount(newCycleCount);
        if (newCycleCount % resetBeforeLongBreak === 0) {
          setPhase('break');
          setTimeLeft(longBreakTime);
        } else {
          setPhase('break');
          setTimeLeft(breakTime);
        }

        setIsRunning(true);
      } else {
        setPhase('work')
        setTimeLeft(workTime);
        setIsRunning(true);
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  },[isRunning, timeLeft, phase])

  // ボタン操作
  const handleStart = () => setIsRunning(true);
  const handleStop = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(phase === 'work' ? workTime : breakTime);
  };
  const handleStopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };
  const handleAddMember = () => {
    const name = memberName;
    if (name && !workingMembers.includes(name)) {
      setWorkingMembers([...workingMembers, name]);
      setMemberName('');
    }
  };
  const handleRemoveMember = (nameToRemove: string) => {
    setWorkingMembers(workingMembers.filter(name => name !== nameToRemove));
  };
  
  
  

  return (
    <div className="h-screen flex flex-col items-center bg-blue-100 py-8">
      {/* ヘッダー（上） */}
      <h1 className="text-4xl font-bold text-blue-800">ポモドーロタイマー</h1>
  
      {/* メイン（中央） */}
      <h2 className="text-[5rem] text-gray-600 mb-2">
        {phase === 'work' ? '作業中' : '休憩中'}
      </h2>
      <h3 className="text-xl text-gray-700">
        セット数: {cycleCount % resetBeforeLongBreak} / {resetBeforeLongBreak}
      </h3>

      <div className="text-[16rem] font-mono">{formatTime(timeLeft)}</div>
  
      {/* フッター（下） */}
      <div className="flex space-x-4">
        <button onClick={handleStart} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
          スタート
        </button>
        <button onClick={handleStop} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition">
          ストップ
        </button>
        <button onClick={handleReset} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">
          時間をリセット
        </button>
        <button onClick={handleStopSound} className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition">
          音を止める
        </button>
      </div>
      <div className="mt-8 text-center">
        <h3 className="text-xl font-semibold mb-2">作業メンバー:</h3>

        <div className="flex flex-col items-center space-y-2">
          <input
            type="text"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            placeholder="名前を入力"
            className="px-4 py-2 border rounded w-64"
          />
          <button
            onClick={handleAddMember}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            追加
          </button>
        </div>
        <ul className="mt-4">
          {workingMembers.map((member, index) => (
            <li key={index} className="text-lg text-gray-700">
              ・{member}
              <button
              onClick={() => handleRemoveMember(member)}
              className="text-sm text-red-500 hover:underline"
            >
              削除
            </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
  
}

export default App;
