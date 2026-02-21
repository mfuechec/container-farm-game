/**
 * Side Hustle Simulator - Main App
 */

import React, { useEffect, useState } from 'react';
import { initEngine, shutdownEngine, gameLoop, getPlayerState, getMoney, getHousing, getJob, getDailyBalance } from './engine';
import ContainerFarm from './businesses/herbs/ContainerFarm';

// Game time display component
function GameHeader() {
  const [time, setTime] = useState(gameLoop.getGameTime());
  const [money, setMoney] = useState(getMoney());
  const [housing, setHousing] = useState(getHousing());
  const [job, setJob] = useState(getJob());

  useEffect(() => {
    const unsubscribe = gameLoop.register(() => {
      setTime(gameLoop.getGameTime());
      setMoney(getMoney());
      setHousing(getHousing());
      setJob(getJob());
    });
    return unsubscribe;
  }, []);

  const dailyBalance = getDailyBalance();
  const balanceColor = dailyBalance >= 0 ? '#4ecdc4' : '#e85d75';

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 20px',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      borderBottom: '1px solid #2a2a4a',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Day</div>
          <div style={{ fontSize: '20px', color: '#fff', fontWeight: 600 }}>
            {time.dayOfMonth}/{time.month}/Y{time.year}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Housing</div>
          <div style={{ fontSize: '14px', color: '#fff' }}>
            🏠 {housing.name}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Job</div>
          <div style={{ fontSize: '14px', color: job.active ? '#4ecdc4' : '#888' }}>
            {job.active ? `💼 ${job.name}` : '🎉 Quit!'}
          </div>
        </div>
      </div>
      
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Balance</div>
        <div style={{ fontSize: '24px', color: '#f7b731', fontWeight: 700 }}>
          ${Math.floor(money).toLocaleString()}
        </div>
        <div style={{ fontSize: '12px', color: balanceColor }}>
          {dailyBalance >= 0 ? '+' : ''}{dailyBalance.toFixed(0)}/day
        </div>
      </div>
    </div>
  );
}

// Business slot component
function BusinessSlot({ 
  index, 
  business, 
  onSelect 
}: { 
  index: number; 
  business: React.ReactNode | null;
  onSelect: () => void;
}) {
  if (business) {
    return <div style={{ flex: 1 }}>{business}</div>;
  }

  return (
    <div 
      onClick={onSelect}
      style={{
        flex: 1,
        minHeight: '200px',
        border: '2px dashed #3a3a5a',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: '#1a1a2e',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#4ecdc4';
        e.currentTarget.style.background = '#1f1f3a';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#3a3a5a';
        e.currentTarget.style.background = '#1a1a2e';
      }}
    >
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>➕</div>
      <div style={{ color: '#888', fontSize: '14px' }}>Empty Slot {index + 1}</div>
      <div style={{ color: '#666', fontSize: '12px' }}>Click to add business</div>
    </div>
  );
}

// Main Home view
function Home() {
  const [housing, setHousing] = useState(getHousing());
  const [showBusinessPicker, setShowBusinessPicker] = useState(false);
  const [businesses, setBusinesses] = useState<(string | null)[]>([]);
  
  useEffect(() => {
    const unsubscribe = gameLoop.register(() => {
      setHousing(getHousing());
    });
    return unsubscribe;
  }, []);

  // Initialize with one herb farm
  useEffect(() => {
    if (businesses.length === 0) {
      setBusinesses(['herbs']);
    }
  }, []);

  const slots = housing.slots;
  const usedSlots = businesses.filter(b => b !== null).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <GameHeader />
      
      {/* Slot indicator */}
      <div style={{
        padding: '12px 20px',
        background: '#12121f',
        borderBottom: '1px solid #2a2a4a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ color: '#888', fontSize: '14px' }}>
          🏠 {usedSlots}/{slots} hobby slots used
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {Array.from({ length: slots }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                background: i < usedSlots ? '#4ecdc4' : '#3a3a5a',
              }}
            />
          ))}
        </div>
      </div>

      {/* Business grid */}
      <div style={{ padding: '20px' }}>
        {businesses.map((biz, i) => (
          <div key={i} style={{ marginBottom: '20px' }}>
            {biz === 'herbs' ? (
              <ContainerFarm />
            ) : (
              <BusinessSlot
                index={i}
                business={null}
                onSelect={() => setShowBusinessPicker(true)}
              />
            )}
          </div>
        ))}
        
        {/* Add more slots if available */}
        {usedSlots < slots && (
          <BusinessSlot
            index={usedSlots}
            business={null}
            onSelect={() => setShowBusinessPicker(true)}
          />
        )}
      </div>

      {/* Business picker modal (placeholder) */}
      {showBusinessPicker && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowBusinessPicker(false)}>
          <div style={{
            background: '#1a1a2e',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px', color: '#fff' }}>Choose a Business</h2>
            <div style={{ color: '#888', marginBottom: '16px' }}>
              More businesses coming soon! For now, you have Container Farm.
            </div>
            <button
              onClick={() => setShowBusinessPicker(false)}
              style={{
                background: '#4ecdc4',
                color: '#000',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Main App with engine lifecycle
export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initEngine();
    setReady(true);
    
    return () => {
      shutdownEngine();
    };
  }, []);

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f0f1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: 'system-ui',
      }}>
        Loading...
      </div>
    );
  }

  return <Home />;
}
