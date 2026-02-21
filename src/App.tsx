/**
 * Side Hustle Simulator - Main App
 */

import React, { useEffect, useState } from 'react';
import { initEngine, shutdownEngine, gameLoop, getPlayerState, getMoney, getHousing, getJob, getDailyBalance, spendMoney } from './engine';
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

// Available businesses to start
const AVAILABLE_BUSINESSES = [
  {
    id: 'herbs',
    name: 'Container Farm',
    description: 'Grow herbs in containers. Breed for better genetics, sell at the farmers market.',
    setupCost: 200,
    icon: '🌱',
  },
  {
    id: 'mushrooms',
    name: 'Mushroom Farm',
    description: 'Coming soon! Grow gourmet mushrooms.',
    setupCost: 150,
    icon: '🍄',
    disabled: true,
  },
];

// Main Home view
function Home() {
  const [housing, setHousing] = useState(getHousing());
  const [showBusinessPicker, setShowBusinessPicker] = useState(false);
  const [businesses, setBusinesses] = useState<string[]>([]);
  const [money, setMoney] = useState(getMoney());
  
  useEffect(() => {
    const unsubscribe = gameLoop.register(() => {
      setHousing(getHousing());
      setMoney(getMoney());
    });
    return unsubscribe;
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
        {/* Render active businesses */}
        {businesses.map((bizId, i) => (
          <div key={bizId} style={{ marginBottom: '20px' }}>
            {bizId === 'herbs' && <ContainerFarm />}
            {/* Add more business types here as they're implemented */}
          </div>
        ))}
        
        {/* Render empty slots */}
        {Array.from({ length: slots - usedSlots }).map((_, i) => (
          <div key={`empty-${i}`} style={{ marginBottom: '20px' }}>
            <BusinessSlot
              index={usedSlots + i}
              business={null}
              onSelect={() => setShowBusinessPicker(true)}
            />
          </div>
        ))}
      </div>

      {/* Business picker modal */}
      {showBusinessPicker && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowBusinessPicker(false)}>
          <div style={{
            background: '#1a1a2e',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid #2a2a4a',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 8px', color: '#fff' }}>Start a Business</h2>
            <p style={{ color: '#888', margin: '0 0 20px', fontSize: '14px' }}>
              Choose a hobby to turn into a side hustle
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {AVAILABLE_BUSINESSES.map(biz => {
                const canAfford = money >= biz.setupCost;
                const alreadyHas = businesses.includes(biz.id);
                const isDisabled = biz.disabled || !canAfford || alreadyHas;
                
                return (
                  <div
                    key={biz.id}
                    onClick={() => {
                      if (isDisabled) return;
                      if (spendMoney(biz.setupCost, `Started ${biz.name}`)) {
                        setBusinesses([...businesses, biz.id]);
                        setShowBusinessPicker(false);
                      }
                    }}
                    style={{
                      padding: '16px',
                      background: isDisabled ? '#12121f' : '#1f1f3a',
                      borderRadius: '8px',
                      border: `1px solid ${isDisabled ? '#2a2a4a' : '#4ecdc4'}`,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '28px' }}>{biz.icon}</div>
                        <div>
                          <div style={{ color: '#fff', fontWeight: 600, marginBottom: '4px' }}>
                            {biz.name}
                          </div>
                          <div style={{ color: '#888', fontSize: '13px', lineHeight: 1.4 }}>
                            {biz.description}
                          </div>
                        </div>
                      </div>
                      <div style={{ 
                        background: canAfford && !biz.disabled ? '#4ecdc4' : '#3a3a5a',
                        color: canAfford && !biz.disabled ? '#000' : '#888',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontWeight: 600,
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                      }}>
                        ${biz.setupCost}
                      </div>
                    </div>
                    {alreadyHas && (
                      <div style={{ color: '#4ecdc4', fontSize: '12px', marginTop: '8px' }}>
                        ✓ Already running
                      </div>
                    )}
                    {!canAfford && !alreadyHas && !biz.disabled && (
                      <div style={{ color: '#e85d75', fontSize: '12px', marginTop: '8px' }}>
                        Not enough money
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <button
              onClick={() => setShowBusinessPicker(false)}
              style={{
                marginTop: '20px',
                background: 'transparent',
                color: '#888',
                border: '1px solid #3a3a5a',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Cancel
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
