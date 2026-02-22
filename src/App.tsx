/**
 * Side Hustle Simulator - Main App
 * Using theme context for consistent styling
 */

import React, { useEffect, useState } from 'react';
import { useTheme } from './theme';
import { initEngine, shutdownEngine, gameLoop, getPlayerState, getMoney, getHousing, getJob, getDailyBalance, spendMoney, HousingTier, skipDay, skipWeek } from './engine';
import { ContainerFarm } from './businesses/herbs';

// Dev controls (for testing time-based mechanics)
function DevControls() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [show, setShow] = useState(false);
  
  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        style={{
          position: 'fixed',
          bottom: '12px',
          right: '12px',
          background: theme.surface,
          color: theme.textMuted,
          border: `1px solid ${theme.border}`,
          padding: '8px 12px',
          borderRadius: theme.radiusMd,
          cursor: 'pointer',
          fontSize: '11px',
          zIndex: 1000,
          boxShadow: theme.shadow,
        }}
      >
        🛠️ Dev
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '12px',
      right: '12px',
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: theme.radiusLg,
      padding: '16px',
      zIndex: 1000,
      fontSize: '12px',
      boxShadow: theme.shadowLg,
    }}>
      <div style={{ 
        color: theme.textSecondary, 
        marginBottom: '12px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        fontWeight: 500,
      }}>
        <span>🛠️ Dev Controls</span>
        <button 
          onClick={() => setShow(false)} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: theme.textMuted, 
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0 4px',
          }}
        >
          ×
        </button>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <button
          onClick={() => { skipDay(); console.log('[Dev] Skipped 1 day'); }}
          style={{
            background: theme.accent,
            color: theme.textInverse,
            border: 'none',
            padding: '8px 14px',
            borderRadius: theme.radiusMd,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
          }}
        >
          +1 Day
        </button>
        <button
          onClick={() => { skipWeek(); console.log('[Dev] Skipped 7 days'); }}
          style={{
            background: theme.money,
            color: theme.textInverse,
            border: 'none',
            padding: '8px 14px',
            borderRadius: theme.radiusMd,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
          }}
        >
          +7 Days
        </button>
      </div>
      <button
        onClick={toggleTheme}
        style={{
          width: '100%',
          background: theme.bgAlt,
          color: theme.textSecondary,
          border: `1px solid ${theme.border}`,
          padding: '8px 14px',
          borderRadius: theme.radiusMd,
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>
      <div style={{ color: theme.textMuted, marginTop: '10px', fontSize: '11px' }}>
        Check console for logs
      </div>
    </div>
  );
}

// Game time display component
function GameHeader() {
  const { theme } = useTheme();
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
  const balanceColor = dailyBalance >= 0 ? theme.accent : theme.danger;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      background: theme.surface,
      borderBottom: `1px solid ${theme.border}`,
      boxShadow: theme.shadow,
    }}>
      <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
        {/* Date */}
        <div>
          <div style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
            Day
          </div>
          <div style={{ fontSize: '18px', color: theme.text, fontWeight: 600 }}>
            {time.dayOfMonth}/{time.month}/Y{time.year}
          </div>
        </div>
        
        {/* Housing */}
        <div>
          <div style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
            Home
          </div>
          <div style={{ fontSize: '14px', color: theme.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🏠</span>
            <span>{housing.name}</span>
          </div>
        </div>
        
        {/* Job */}
        <div>
          <div style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
            Job
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: job.active ? theme.text : theme.accent,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span>{job.active ? '💼' : '🎉'}</span>
            <span>{job.active ? job.name : 'Full-time Hustler'}</span>
          </div>
        </div>
      </div>
      
      {/* Money */}
      <div style={{ 
        textAlign: 'right',
        background: theme.moneyLight,
        padding: '12px 20px',
        borderRadius: theme.radiusLg,
      }}>
        <div style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
          Savings
        </div>
        <div style={{ fontSize: '24px', color: theme.money, fontWeight: 700 }}>
          ${Math.floor(money).toLocaleString()}
        </div>
        <div style={{ fontSize: '12px', color: balanceColor, fontWeight: 500 }}>
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
  const { theme } = useTheme();
  const hasHobby = businesses.length > 0;
  const hobbyBiz = businesses[0];

  // Studio apartment layout
  if (housing.id === 1) {
    return (
      <div style={{
        background: theme.surface,
        borderRadius: theme.radiusLg,
        padding: '24px',
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <div style={{ 
            color: theme.text, 
            fontSize: '16px', 
            fontWeight: 600,
          }}>
            🏠 {housing.name}
          </div>
          <div style={{ 
            color: theme.textSecondary, 
            fontSize: '13px',
            background: theme.bg,
            padding: '6px 12px',
            borderRadius: theme.radiusMd,
          }}>
            Rent: ${housing.rentPerDay}/day
          </div>
        </div>

        {/* Floor plan */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '520px',
          margin: '0 auto',
          aspectRatio: '4/3',
          border: `2px solid ${theme.border}`,
          borderRadius: theme.radiusLg,
          background: theme.bgAlt,
          overflow: 'hidden',
        }}>
          {/* Subtle grid pattern */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(${theme.borderLight} 1px, transparent 1px),
              linear-gradient(90deg, ${theme.borderLight} 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
            opacity: 0.5,
          }} />

          {/* Bathroom - top right */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '25%',
            height: '35%',
            borderLeft: `2px solid ${theme.border}`,
            borderBottom: `2px solid ${theme.border}`,
            borderBottomLeftRadius: theme.radiusMd,
            background: theme.accentLight,
            opacity: 0.5,
          }}>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>🚿</div>
              <div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: 500 }}>Bath</div>
            </div>
          </div>

          {/* Kitchen - bottom left */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '38%',
            height: '32%',
            borderTop: `2px dashed ${theme.border}`,
            borderRight: `2px dashed ${theme.border}`,
            borderTopRightRadius: theme.radiusMd,
            background: theme.moneyLight,
            opacity: 0.5,
          }}>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>🍳</div>
              <div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: 500 }}>Kitchen</div>
            </div>
          </div>

          {/* Bed area - top left */}
          <div style={{
            position: 'absolute',
            top: '8%',
            left: '5%',
            width: '32%',
            height: '38%',
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radiusMd,
            background: theme.surfaceActive,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🛏️</div>
            <div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: 500 }}>Bed</div>
          </div>

          {/* Door */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: '28%',
            width: '14%',
            height: '6px',
            background: theme.accent,
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px',
          }}>
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: theme.textSecondary,
              fontSize: '9px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}>
              🚪 Entry
            </div>
          </div>

          {/* HOBBY SPACE - the main interactive area */}
          <div
            onClick={() => hasHobby ? onClickBusiness(hobbyBiz) : onClickSpace(0)}
            style={{
              position: 'absolute',
              bottom: '10%',
              right: '4%',
              width: '48%',
              height: '52%',
              border: hasHobby ? `2px solid ${theme.accent}` : `2px dashed ${theme.accent}`,
              borderRadius: theme.radiusLg,
              background: hasHobby ? theme.accentLight : `${theme.accent}08`,
              cursor: 'pointer',
              transition: `all ${theme.transitionNormal}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = theme.shadowGlow;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {hasHobby ? (
              <>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>
                  {hobbyBiz === 'herbs' ? '🌱' : '📦'}
                </div>
                <div style={{ 
                  color: theme.accent, 
                  fontSize: '13px', 
                  fontWeight: 600,
                  textAlign: 'center',
                }}>
                  {hobbyBiz === 'herbs' ? 'Container Farm' : hobbyBiz}
                </div>
                <div style={{ 
                  color: theme.textSecondary, 
                  fontSize: '11px', 
                  marginTop: '6px',
                }}>
                  Click to manage →
                </div>
              </>
            ) : (
              <>
                <div style={{ 
                  color: theme.accent, 
                  fontSize: '12px', 
                  fontWeight: 500,
                  marginBottom: '8px',
                }}>
                  Hobby Space
                </div>
                <div style={{ 
                  fontSize: '28px', 
                  opacity: 0.5,
                  marginBottom: '8px',
                }}>➕</div>
                <div style={{ 
                  color: theme.textSecondary, 
                  fontSize: '11px',
                }}>
                  Click to start a side hustle
                </div>
              </>
            )}
          </div>

          {/* Window indicators - warm light coming in */}
          <div style={{
            position: 'absolute',
            top: '25%',
            right: 0,
            width: '5px',
            height: '18%',
            background: `linear-gradient(to left, ${theme.money}40, transparent)`,
            borderTopLeftRadius: '4px',
            borderBottomLeftRadius: '4px',
          }} />
          <div style={{
            position: 'absolute',
            top: '18%',
            left: 0,
            width: '5px',
            height: '22%',
            background: `linear-gradient(to right, ${theme.money}40, transparent)`,
            borderTopRightRadius: '4px',
            borderBottomRightRadius: '4px',
          }} />
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: theme.textMuted,
          fontSize: '12px',
        }}>
          <span>Your cozy studio</span>
          <span style={{ 
            background: hasHobby ? theme.accentLight : theme.bg,
            color: hasHobby ? theme.accent : theme.textMuted,
            padding: '4px 10px',
            borderRadius: theme.radiusSm,
            fontWeight: 500,
          }}>
            {businesses.length}/1 hobby space
          </span>
        </div>
      </div>
    );
  }

  // Fallback for other housing tiers
  return (
    <div style={{
      background: theme.surface,
      borderRadius: theme.radiusLg,
      padding: '24px',
      boxShadow: theme.shadow,
      border: `1px solid ${theme.border}`,
      textAlign: 'center',
    }}>
      <div style={{ color: theme.text, fontWeight: 600, marginBottom: '12px' }}>
        🏠 {housing.name}
      </div>
      <div style={{ color: theme.textSecondary, fontSize: '14px' }}>
        Layout coming soon! ({housing.slots} hobby spaces)
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
  const { theme } = useTheme();
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
        background: theme.bg,
      }}>
        <GameHeader />
        
        {/* Back button */}
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${theme.border}`,
        }}>
          <button
            onClick={() => setActiveBusiness(null)}
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              color: theme.textSecondary,
              padding: '10px 18px',
              borderRadius: theme.radiusMd,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: theme.shadow,
            }}
          >
            ← Back to Apartment
          </button>
        </div>
        
        {/* Business UI */}
        <div style={{ padding: '24px' }}>
          {activeBusiness === 'herbs' && <ContainerFarm />}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
    }}>
      <GameHeader />
      
      {/* Apartment layout */}
      <div style={{ padding: '24px', maxWidth: '720px', margin: '0 auto' }}>
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
          background: `${theme.text}99`,
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowBusinessPicker(false)}>
          <div style={{
            background: theme.surface,
            borderRadius: theme.radiusLg,
            padding: '28px',
            maxWidth: '440px',
            width: '90%',
            boxShadow: theme.shadowLg,
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 6px', color: theme.text, fontSize: '20px', fontWeight: 600 }}>
              Start a Side Hustle
            </h2>
            <p style={{ color: theme.textSecondary, margin: '0 0 24px', fontSize: '14px' }}>
              Turn a hobby into income
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
                      padding: '18px',
                      background: isDisabled ? theme.bg : theme.surface,
                      borderRadius: theme.radiusLg,
                      border: `2px solid ${isDisabled ? theme.border : theme.accent}`,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.6 : 1,
                      transition: `all ${theme.transitionFast}`,
                    }}
                    onMouseEnter={(e) => {
                      if (!isDisabled) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = theme.shadow;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div style={{ 
                          fontSize: '32px',
                          background: theme.accentLight,
                          padding: '8px',
                          borderRadius: theme.radiusMd,
                        }}>{biz.icon}</div>
                        <div>
                          <div style={{ color: theme.text, fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>
                            {biz.name}
                          </div>
                          <div style={{ color: theme.textSecondary, fontSize: '13px', lineHeight: 1.5 }}>
                            {biz.description}
                          </div>
                        </div>
                      </div>
                      <div style={{ 
                        background: canAfford && !biz.disabled ? theme.accent : theme.bg,
                        color: canAfford && !biz.disabled ? theme.textInverse : theme.textMuted,
                        padding: '8px 14px',
                        borderRadius: theme.radiusMd,
                        fontWeight: 600,
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                        border: canAfford && !biz.disabled ? 'none' : `1px solid ${theme.border}`,
                      }}>
                        ${biz.setupCost}
                      </div>
                    </div>
                    {alreadyHas && (
                      <div style={{ 
                        color: theme.accent, 
                        fontSize: '12px', 
                        marginTop: '10px',
                        fontWeight: 500,
                      }}>
                        ✓ Already running
                      </div>
                    )}
                    {!canAfford && !alreadyHas && !biz.disabled && (
                      <div style={{ 
                        color: theme.danger, 
                        fontSize: '12px', 
                        marginTop: '10px',
                        fontWeight: 500,
                      }}>
                        Not enough savings
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
                color: theme.textSecondary,
                border: `1px solid ${theme.border}`,
                padding: '12px 20px',
                borderRadius: theme.radiusMd,
                cursor: 'pointer',
                width: '100%',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Main App with engine lifecycle
export default function App() {
  const { theme } = useTheme();
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
        background: theme.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.text,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌱</div>
          <div style={{ color: theme.textSecondary }}>Loading...</div>
        </div>
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
