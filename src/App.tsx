import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Type } from 'lucide-react'

type Mode = 'work' | 'shortBreak' | 'longBreak'

interface ModeConfig {
  label: string
  time: number
  color: string
}

interface Modes {
  work: ModeConfig
  shortBreak: ModeConfig
  longBreak: ModeConfig
}

interface Settings {
  workTime: number
  shortBreakTime: number
  longBreakTime: number
  sessionsUnitLongBreak: number
}

interface CompletedSession {
  id: number,
  mode: Mode,
  completedAt: string,
  duration: number,
}

const App = () => {
  const [sessions, setSessions] = useState(0)
  const [settings, setSettings] = useState<Settings>({
    workTime: 25,
    shortBreakTime: 5,
    longBreakTime: 20,
    sessionsUnitLongBreak: 4,
  })
  const [mode, setMode] = useState<Mode>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioTimeoutRef = useRef<number | null>(null);
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([])

  useEffect(() => {
    audioRef.current = new Audio('/honwaka.mp3')
    audioRef.current.volume = 0.5

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (audioTimeoutRef.current) {
        clearTimeout(audioTimeoutRef.current)
        audioTimeoutRef.current = null
      }
    }
  }, [])

  const modes: Modes = {
    work: {
      label: '作業',
      time: settings.workTime,
      color: 'bg-red-500',
    },
    shortBreak: {
      label: '休憩',
      time: settings.shortBreakTime,
      color: 'bg-green-500',
    },
    longBreak: {
      label: '長い休憩',
      time: settings.longBreakTime,
      color: 'bg-blue-500',
    }
  }

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(error => {
        console.warn('音声の再生に失敗しました:', error)
      })
      audioTimeoutRef.current = window.setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        }
      }, 10000)
    }
  }

  // 時間のフォーマット関数（mm:ss）
  const formatTime = (seconds: number) => {
    const min = String(Math.floor(seconds / 60)).padStart(2, '0');
    const sec = String(seconds % 60).padStart(2, '0');
    return `${min}:${sec}`;
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      playNotificationSound()

      const completedSession = {
        id: Date.now(),
        mode: mode,
        completedAt: new Date().toLocaleString('ja-JP'),
        duration: modes[mode].time
      }
      setCompletedSessions(prev => [...prev, completedSession])

      if (mode === 'work') {
        const newSessions = sessions + 1;
        setSessions(newSessions);

        if (newSessions % settings.sessionsUnitLongBreak === 0) {
          setMode('longBreak');
          setTimeLeft(settings.longBreakTime * 60);
        } else {
          setMode('shortBreak');
          setTimeLeft(settings.shortBreakTime * 60);
        }
      } else {
        setMode('work')
        setTimeLeft(settings.workTime * 60);
      }
    }else {
      if (timerRef.current !== null){
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current !== null){
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  },[isRunning, timeLeft, mode, sessions, settings])

  // ボタン操作
  const handleTimer = () => {
    setIsRunning(!isRunning);
  }

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(modes[mode].time * 60);
  };

  const switchMode = (newMode: Mode) => {
    if (isRunning) {
      if (!window.confirm('タイマーが実行中です。変更しますか？')) {
        return;
      }
    }
    setMode(newMode)
    setTimeLeft(modes[newMode].time * 60)
    setIsRunning(false)
  }

  const handleSettings = () => {
    setShowSettings(!showSettings)
  }

  const updateSettings = (newSettings: Settings) => {
    const oldSettings = settings
    setSettings(newSettings)

    const currentModeTimeChanged = 
    (mode === 'work' && settings.workTime !== oldSettings.workTime) ||
    (mode === 'shortBreak' && settings.shortBreakTime !== oldSettings.shortBreakTime) ||
    (mode === 'longBreak' && settings.longBreakTime !== oldSettings.longBreakTime);
  
  if (!isRunning && currentModeTimeChanged) {
    const newModes = {
      work: { label: '作業', time: settings.workTime, color: 'bg-red-500' },
      shortBreak: { label: '休憩', time: settings.shortBreakTime, color: 'bg-green-500' },
      longBreak: { label: '長い休憩', time: settings.longBreakTime, color: 'bg-blue-500' }
    };
    setTimeLeft(newModes[mode].time * 60);
  }
  }

  const progress = ((modes[mode].time * 60 - timeLeft) / (modes[mode].time*60)) *100

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8">
      <div className='max-w-md mx-auto'>
        <div className='text-center mb-8'>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ポモドーロタイマー</h1>
          <p className='text-gray-600'>集中して学習しましょう！</p>
        </div>

        <div className={`${modes[mode].color} rounded-3xl p-8 text-white shadow-2xl mb-6 transition-all duration-500`}>
          <div className='text-center'>
            <h2 className="text-xl font-semibold mb-4">
              {modes[mode].label}
            </h2>
            {/* プログレスバー */}
            <div className='w-full bg-white bg-opacity-20 rounded-full h-3 mb-6'>
              <div className='bg-white h-3 rounded-full transition-all duration-1000 ease-linear' style={{width: `${progress}%`}}></div>
            </div>

            <div className="text-6xl font-mono font-bold mb-8 tabular-nums">{formatTime(timeLeft)}</div>
        
            <div className="flex justify-center gap-4">
              <button onClick={handleTimer} className="bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 p-4 transition">
                {isRunning ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button onClick={resetTimer} className="bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 p-4 transition">
                <RotateCcw size={24} />
              </button>
              <button onClick={handleSettings} className={`bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 p-4 transition ${showSettings ? 'bg-opacity-30' : 'bg-opacity-20'}`}>
                <Settings size={24} />
              </button>
            </div>
          </div>
        </div>
        <div className='grid grid-cols-3 gap-2 mb-6'>
          {
            Object.entries(modes).map(([key, modeInfo]) => {
              const typedKey = key as Mode
              return (
                <button
                key={key}
                onClick={() => switchMode(typedKey)}
                className={`p-3 rounded-xl ${mode === typedKey  ? `${modeInfo.color} text-white shadow-lg` : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {modeInfo.label}
                </button>
              );
            })
          }
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">今日の統計</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{sessions}</div>
              <div className="text-gray-600">完了セッション</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {Math.floor(completedSessions.filter(s => s.mode === 'work').reduce((acc, s) => acc + s.duration, 0))}
              </div>
              <div className="text-gray-600">総学習時間（分）</div>
            </div>
          </div>
        </div>

        {
          showSettings && (
            <div className='bg-white rounded-xl p-4 shadow-lg mb-6'>
              <h3 className='text-gray-600 font-semibold mb-1'>設定</h3>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm text-gray-600 mb-1'>作業時間(分)</label>
                  <input
                    type='number'
                    value={settings.workTime}
                    onChange={(e) => updateSettings({...settings, workTime: parseInt(e.target.value)})}
                    className='w-full p-2 border rounded-lg'
                    min="1"
                    max="60"
                  />
                </div>
                <div>
                  <label className='block text-sm text-gray-600 mb-1'>短い休憩時間(分)</label>
                  <input
                   type='number'
                   value={settings.shortBreakTime}
                   onChange={(e) => updateSettings({...settings, shortBreakTime: parseInt(e.target.value)})}
                   className='w-full p-2 border rounded-lg'
                   min="1"
                   max="60"
                  />
                </div>
                <div>
                  <label className='block text-sm text-gray-600 mb-1'>長い休憩時間(分)</label>
                  <input
                   type='number'
                   value={settings.longBreakTime}
                   onChange={(e) => updateSettings({...settings, longBreakTime: parseInt(e.target.value)})}
                   className='w-full p-2 border rounded-lg'
                   min="1"
                   max="60"
                  />
                </div>
                <div>
                  <label className='block text-sm text-gray-600 mb-1'>長い休憩時間までのセッション数</label>
                  <input
                   type='number'
                   value={settings.sessionsUnitLongBreak}
                   onChange={(e) => updateSettings({...settings, sessionsUnitLongBreak: parseInt(e.target.value)})}
                   className='w-full p-2 border rounded-lg'
                   min="1"
                   max="100"
                  />
                </div>
              </div>
            </div>
          )
        }
        {completedSessions.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-3">最近の履歴</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {completedSessions.slice(-8).reverse().map((session) => (
                <div key={session.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-b-0">
                  <span className={`px-2 py-1 rounded text-white text-xs ${modes[session.mode].color}`}>
                    {modes[session.mode].label}
                  </span>
                  <span className="text-gray-600 font-medium">{session.duration}分</span>
                  <span className="text-gray-400 text-xs">{session.completedAt}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
