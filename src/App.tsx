/**
 * Side Hustle Simulator - Main App
 */

import React, { useEffect, useState } from 'react';
import { initEngine, shutdownEngine, gameLoop, getPlayerState, getMoney, getHousing, getJob, getDailyBalance, spendMoney, HousingTier, skipDay, skipWeek } from './engine';
import ContainerFarm from './businesses/herbs/ContainerFarm';

// Dev controls (for testing time-based mechanics)
function DevControls() {
  const [show, setShow] = useState(false);
  
  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: '#2a2a4a',
          color: '#888',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px',
          zIndex: 1000,
        }}
      >
        🛠️ Dev
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: '#1a1a2e',
      border: '1px solid #3a3a5a',
      borderRadius: '8px',
      padding: '12px',
      zIndex: 1000,
      fontFamily: 'monospace',
      fontSize: '12px',
    }}>
      <div style={{ color: '#888', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🛠️ Dev Controls</span>
        <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => { skipDay(); console.log('[Dev] Skipped 1 day'); }}
          style={{
            background: '#4ecdc4',
            color: '#000',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          +1 Day
        </button>
        <button
          onClick={() => { skipWeek(); console.log('[Dev] Skipped 7 days'); }}
          style={{
            background: '#f7b731',
            color: '#000',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          +7 Days
        </button>
      </div>
      <div style={{ color: '#666', marginTop: '8px', fontSize: '10px' }}>
        Check console for economy logs
      </div>
    </div>
  );
}

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

// Blueprint-style apartment layout
function ApartmentLayout({ 
  housing,
  businesses,
  onClickSpace,
  onClickBusiness,
}: { 
  housing: HousingTier;
  businesses: string[];
  onClickSpace: (slotIndex: number) => void;
  onClickBusiness: (businessId: string) => void;
}) {
  const hasHobby = businesses.length > 0;
  const hobbyBiz = businesses[0];

  // Studio apartment blueprint
  if (housing.id === 1) {
    return (
      <div style={{
        background: '#0a1628',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #1a3a5c',
      }}>
        {/* Blueprint header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}>
          <div style={{ 
            color: '#4a9eff', 
            fontSize: '14px', 
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}>
            ◊ {housing.name} — Floor Plan
          </div>
          <div style={{ 
            color: '#3a7acc', 
            fontSize: '12px',
            fontFamily: 'monospace',
          }}>
            Rent: ${housing.rentPerDay}/day
          </div>
        </div>

        {/* Blueprint floor plan */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '500px',
          margin: '0 auto',
          aspectRatio: '4/3',
          border: '2px solid #2a5a8c',
          background: 'linear-gradient(135deg, #0d1f33 0%, #0a1628 100%)',
        }}>
          {/* Grid lines */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(#1a3a5c22 1px, transparent 1px),
              linear-gradient(90deg, #1a3a5c22 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }} />

          {/* Bathroom - top right corner */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '25%',
            height: '35%',
            borderLeft: '2px solid #2a5a8c',
            borderBottom: '2px solid #2a5a8c',
          }}>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              color: '#3a7acc',
              fontSize: '10px',
              fontFamily: 'monospace',
              textAlign: 'center',
            }}>
              🚿<br/>BATH
            </div>
          </div>

          {/* Kitchen - bottom left */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '40%',
            height: '30%',
            borderTop: '2px dashed #2a5a8c44',
            borderRight: '2px dashed #2a5a8c44',
          }}>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              color: '#3a7acc',
              fontSize: '10px',
              fontFamily: 'monospace',
              textAlign: 'center',
            }}>
              🍳 KITCHEN
            </div>
          </div>

          {/* Bed area - top left */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '5%',
            width: '35%',
            height: '40%',
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              border: '1px solid #2a5a8c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3a7acc',
              fontSize: '10px',
              fontFamily: 'monospace',
            }}>
              🛏️ BED
            </div>
          </div>

          {/* Door */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: '30%',
            width: '15%',
            height: '4px',
            background: '#4a9eff',
          }}>
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#4a9eff',
              fontSize: '8px',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
            }}>
              🚪 ENTRY
            </div>
          </div>

          {/* HOBBY SPACE - bottom right, clickable */}
          <div
            onClick={() => hasHobby ? onClickBusiness(hobbyBiz) : onClickSpace(0)}
            style={{
              position: 'absolute',
              bottom: '8%',
              right: '5%',
              width: '45%',
              height: '55%',
              border: hasHobby ? '2px solid #4ecdc4' : '2px dashed #4ecdc4',
              borderRadius: '4px',
              background: hasHobby 
                ? 'linear-gradient(135deg, #1a3a2f 0%, #0d2818 100%)' 
                : 'rgba(78, 205, 196, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = hasHobby 
                ? 'linear-gradient(135deg, #1f4a3a 0%, #0f3020 100%)'
                : 'rgba(78, 205, 196, 0.1)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(78, 205, 196, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = hasHobby 
                ? 'linear-gradient(135deg, #1a3a2f 0%, #0d2818 100%)'
                : 'rgba(78, 205, 196, 0.05)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {hasHobby ? (
              <>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                  {hobbyBiz === 'herbs' ? '🌱' : '📦'}
                </div>
                <div style={{ 
                  color: '#4ecdc4', 
                  fontSize: '11px', 
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  textAlign: 'center',
                }}>
                  {hobbyBiz === 'herbs' ? 'CONTAINER FARM' : hobbyBiz.toUpperCase()}
                </div>
                <div style={{ 
                  color: '#3a7acc', 
                  fontSize: '9px', 
                  fontFamily: 'monospace',
                  marginTop: '4px',
                }}>
                  [ click to manage ]
                </div>
              </>
            ) : (
              <>
                <div style={{ 
                  color: '#4ecdc4', 
                  fontSize: '10px', 
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '8px',
                }}>
                  ◇ Hobby Space ◇
                </div>
                <div style={{ fontSize: '24px', opacity: 0.6 }}>➕</div>
                <div style={{ 
                  color: '#3a7acc', 
                  fontSize: '9px', 
                  fontFamily: 'monospace',
                  marginTop: '8px',
                }}>
                  [ click to start ]
                </div>
              </>
            )}
          </div>

          {/* Window indicators */}
          <div style={{
            position: 'absolute',
            top: '30%',
            right: 0,
            width: '4px',
            height: '20%',
            background: '#4a9eff55',
          }} />
          <div style={{
            position: 'absolute',
            top: '20%',
            left: 0,
            width: '4px',
            height: '25%',
            background: '#4a9eff55',
          }} />
        </div>

        {/* Blueprint footer */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#3a7acc',
          fontSize: '10px',
          fontFamily: 'monospace',
        }}>
          <span>SCALE: NOT TO SCALE</span>
          <span>{businesses.length}/1 HOBBY SPACE</span>
        </div>
      </div>
    );
  }

  // Fallback for other housing tiers (TODO: add more blueprints)
  return (
    <div style={{
      background: '#0a1628',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #1a3a5c',
      textAlign: 'center',
      color: '#4a9eff',
      fontFamily: 'monospace',
    }}>
      <div style={{ marginBottom: '16px' }}>◊ {housing.name} — Floor Plan</div>
      <div style={{ color: '#3a7acc', fontSize: '12px' }}>
        Blueprint coming soon! ({housing.slots} hobby spaces)
      </div>
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
  const [activeBusiness, setActiveBusiness] = useState<string | null>(null);
  
  useEffect(() => {
    const unsubscribe = gameLoop.register(() => {
      setHousing(getHousing());
      setMoney(getMoney());
    });
    return unsubscribe;
  }, []);

  // If viewing a specific business, show its full UI
  if (activeBusiness) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <GameHeader />
        
        {/* Back button */}
        <div style={{
          padding: '12px 20px',
          background: '#12121f',
          borderBottom: '1px solid #2a2a4a',
        }}>
          <button
            onClick={() => setActiveBusiness(null)}
            style={{
              background: 'transparent',
              border: '1px solid #3a3a5a',
              color: '#888',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            ← Back to Apartment
          </button>
        </div>
        
        {/* Business UI */}
        <div style={{ padding: '20px' }}>
          {activeBusiness === 'herbs' && <ContainerFarm />}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <GameHeader />
      
      {/* Apartment layout */}
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <ApartmentLayout
          housing={housing}
          businesses={businesses}
          onClickSpace={() => setShowBusinessPicker(true)}
          onClickBusiness={(bizId) => setActiveBusiness(bizId)}
        />
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

  return (
    <>
      <Home />
      <DevControls />
    </>
  );
}
