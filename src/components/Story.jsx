import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { storyConfig as defaultConfig, calculateDaysBetween, formatDate } from '../config/storyConfig';

const StoryContainer = styled.div`
  width: 100%;
  height: 100vh;
  height: 100dvh;
  background: linear-gradient(135deg, #d44f8c, #FFF0F3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  gap: 16px;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
`;

const StoryCard = styled(motion.div)`
  width: 100%;
  max-width: 400px;
  height: calc(100vh - 85px);
  height: calc(100dvh - 85px);
  max-height: 800px;
  background: linear-gradient(180deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(255, 243, 245, 0.98) 100%
  );
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 8px 32px rgba(212, 79, 140, 0.2),
    0 0 0 1px rgba(212, 79, 140, 0.1);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  padding: 24px 16px;
  margin-top: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  box-sizing: border-box;
  user-select: none;
  -webkit-user-select: none;

  h2 {
    color: #E6356F;
    font-size: clamp(1.5rem, 5vw, 2rem);
    font-weight: 700;
    margin-bottom: 15px;
  }

  p {
    color: #333333;
    font-size: clamp(1rem, 4vw, 1.2rem);
    line-height: 1.6;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const SlideContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  text-align: center;
  padding: 32px 24px;
  box-sizing: border-box;

  h2 {
    color: #E6356F;
    font-size: clamp(1.8rem, 5vw, 2.2rem);
    font-weight: 700;
    letter-spacing: -0.5px;
    margin: 0;
  }

  p {
    color: #333333;
    font-size: clamp(1.1rem, 4vw, 1.3rem);
    line-height: 1.6;
    margin: 0;
    font-weight: 500;
    max-width: 85%;
  }
`;

const ListContainer = styled.div`
  width: 100%;
  max-height: 60vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px;
  box-sizing: border-box;
  margin-top: 8px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(212, 79, 140, 0.1);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(212, 79, 140, 0.3);
    border-radius: 4px;

    &:hover {
      background: rgba(212, 79, 140, 0.5);
    }
  }
`;

const ListItem = styled.div`
  width: 100%;
  padding: 16px;
  background: rgba(212, 79, 140, 0.08);
  border: 1px solid rgba(212, 79, 140, 0.2);
  border-radius: 12px;
  box-sizing: border-box;
  text-align: center;
  color: #333333;
  font-size: clamp(1rem, 3.5vw, 1.2rem);
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(212, 79, 140, 0.12);
    transform: translateY(-2px);
  }
`;

const ProgressContainer = styled.div`
  width: 100%;
  max-width: 400px;
  height: 4px;
  display: flex;
  gap: 4px;
  z-index: 30;
  padding: 0 4px;
  box-sizing: border-box;
  margin-bottom: 5px;
`;

const ProgressSegment = styled.div`
  flex: 1;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: white;
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
  transform-origin: left;
  will-change: width;
`;

const StatNumber = styled.div`
  font-size: clamp(2.8rem, 8vw, 3.8rem);
  font-weight: 800;
  background: linear-gradient(45deg, #d44f8c, #ff8fb2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  width: 100%;
  margin: 8px 0;
  line-height: 1.2;
`;

const StoryImage = styled(motion.img)`
  width: calc(100% - 32px);
  height: 200px;
  object-fit: cover;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
`;

const NavigationOverlay = styled.div`
  position: absolute;
  top: 44px;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  z-index: 20;
  pointer-events: none;
  touch-action: none;
`;

const NavigationHalf = styled.div`
  flex: 1;
  height: 100%;
  cursor: pointer;
  pointer-events: auto;
  touch-action: none;
`;

const ReloadIcon = styled.span`
  display: inline-block;
  margin-right: 8px;
  transform: rotate(0deg);
  transition: transform 0.3s ease;

  &:hover {
    transform: rotate(-180deg);
  }
`;

const RestartButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(45deg, #d44f8c, #ff8fb2);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(212, 79, 140, 0.3);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 79, 140, 0.4);
  }
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 200px;
  margin-top: -20px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const FullCoverSlide = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  box-sizing: border-box;
  background: linear-gradient(
    rgba(0, 0, 0, 0.6),
    rgba(0, 0, 0, 0.6)
  ), url(${props => props.image});
  background-size: cover;
  background-position: center;
  color: white;

  h2 {
    color: white !important;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    font-size: clamp(1.8rem, 5vw, 2.2rem);
    font-weight: 700;
    letter-spacing: -0.5px;
    margin: 0;
  }

  p {
    color: white !important;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    font-size: clamp(1.1rem, 4vw, 1.3rem);
    line-height: 1.6;
    margin: 0;
    font-weight: 500;
    max-width: 85%;
  }
`;

const VideoContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  video {
    width: 100%;
    max-height: 70vh;
    border-radius: 12px;
    object-fit: cover;
  }
`;

const AutoScrollList = ({ items, subtext }) => {
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;

    const scrollHeight = listRef.current.scrollHeight;
    const duration = items.length * 300;
    let start = null;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;

      const percentage = Math.min(progress / duration, 1);
      listRef.current.scrollTop = percentage * (scrollHeight - listRef.current.clientHeight);

      if (percentage < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [items]);

  return (
    <>
      <ListContainer ref={listRef}>
        {items.map((item, index) => (
          <ListItem key={index}>
            {item.name} {item.count}
          </ListItem>
        ))}
      </ListContainer>
      {subtext && <p>{subtext}</p>}
    </>
  );
};

const IncreasingNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayValue(prev => prev + 1);
    }, 1000);

    const stopTimer = setTimeout(() => {
      clearInterval(timer);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(stopTimer);
    };
  }, [value]);

  return <span>{displayValue.toLocaleString()} segundos</span>;
};

const Story = ({ config = defaultConfig }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const touchStartX = useRef(0);
  const touchStartTime = useRef(0);
  const minSwipeDistance = 30;
  const tapDurationThreshold = 150;

  const processedSlides = config.slides.map(slide => {
    if (slide.type === 'stat' && slide.showDaysCount) {
      return {
        ...slide,
        content: `${calculateDaysBetween(config.startDate, config.endDate)} days since <something here>`,
        subtext: formatDate(config.startDate)
      };
    }
    if (slide.type === 'list' && slide.items) {
      return { ...slide, content: slide.items };
    }
    if (slide.type === 'pie' && slide.items) {
      return { ...slide, chartData: slide.items };
    }
    return slide;
  });

  const slides = processedSlides;

  const nextSlide = (e) => {
    if (e) e.preventDefault();
    if (currentSlide < slides.length - 1) {
      setProgressKey(prev => prev + 1);
      setCurrentSlide(currentSlide + 1);
    }
  };

  const previousSlide = (e) => {
    if (e) e.preventDefault();
    if (currentSlide > 0) {
      setProgressKey(prev => prev + 1);
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleRestart = (e) => {
    e.stopPropagation();
    setCurrentSlide(0);
    setProgressKey(prev => prev + 1);
    setIsPaused(false);
  };

  const COLORS = ['#d44f8c', '#ff8fb2', '#ffb3c6', '#ffd7e0'];

  const renderSlideContent = (slide) => {
    switch (slide.type) {
      case 'photo':
        return (
          <SlideContent>
            <h2>{slide.title}</h2>
            <StoryImage
              src={slide.image}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            />
            <p dangerouslySetInnerHTML={{ __html: slide.content }} />
            {currentSlide === slides.length - 1 && (
              <RestartButton onClick={handleRestart} style={{ position: 'relative', zIndex: 30 }}>
                Watch Again <ReloadIcon>🔄</ReloadIcon>
              </RestartButton>
            )}
          </SlideContent>
        );
      case 'stat':
        return (
          <SlideContent>
            <h2>{slide.title}</h2>
            <StatNumber>
              {typeof slide.content === 'string' && slide.content.includes('segundos') ? (
                <IncreasingNumber value={parseInt(slide.content.replace(/[^0-9]/g, ''))} />
              ) : (
                slide.content
              )}
            </StatNumber>
            <p>{slide.subtext}</p>
          </SlideContent>
        );
      case 'list':
        return (
          <SlideContent>
            <h2>{slide.title}</h2>
            <AutoScrollList items={slide.items} subtext={slide.subtext} />
          </SlideContent>
        );
      case 'pie':
        return (
          <SlideContent style={{ justifyContent: 'start', marginTop: '-85px' }}>
            <h2>{slide.title}</h2>
            <p>{slide.subtext}</p>
            <ChartContainer>
              <ResponsiveContainer width="95%" height="100%">
                <PieChart>
                  <Pie
                    data={slide.chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {slide.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <ListContainer style={{ marginTop: '-20px' }}>
              {slide.chartData.map((entry, index) => (
                <ListItem
                  key={index}
                  style={{ background: COLORS[index], color: 'white', fontSize: '0.9rem', padding: '8px' }}
                >
                  {entry.name} - {entry.value}x
                </ListItem>
              ))}
            </ListContainer>
          </SlideContent>
        );
      case 'chart': {
        const hasData = Array.isArray(slide.chartData) && slide.chartData.length > 0;
        return (
          <SlideContent>
            <h2>{slide.title}</h2>
            {hasData ? (
              <ChartContainer>
                <ResponsiveContainer width="95%" height="100%">
                  <BarChart data={slide.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis
                      dataKey={
                        slide.chartData[0].month ? 'month' :
                        slide.chartData[0].activity ? 'activity' : 'song'
                      }
                      stroke="#666"
                      fontSize={12}
                    />
                    <YAxis stroke="#666" fontSize={12} />
                    <Bar
                      dataKey={
                        slide.chartData[0].count ? 'count' :
                        slide.chartData[0].hours ? 'hours' : 'plays'
                      }
                      fill="#d44f8c"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p>No data to display.</p>
            )}
            {slide.content && <p>{slide.content}</p>}
          </SlideContent>
        );
      }
      case 'full-cover':
        return (
          <FullCoverSlide image={slide.image}>
            <h2 dangerouslySetInnerHTML={{ __html: slide.title }} />
            <p dangerouslySetInnerHTML={{ __html: slide.content }} />
          </FullCoverSlide>
        );
      case 'video':
        return (
          <SlideContent>
            <h2>{slide.title}</h2>
            <VideoContainer>
              <video controls autoPlay muted={false} playsInline src={slide.videoUrl} />
              <p>{slide.content}</p>
              {currentSlide === slides.length - 1 && (
                <RestartButton onClick={handleRestart} style={{ position: 'relative', zIndex: 30 }}>
                  Watch Again <ReloadIcon>🔄</ReloadIcon>
                </RestartButton>
              )}
            </VideoContainer>
          </SlideContent>
        );
      default:
        return (
          <SlideContent>
            <h2 dangerouslySetInnerHTML={{ __html: slide.title }} />
            <p>{slide.content}</p>
            {slide.subtext && <p>{slide.subtext}</p>}
          </SlideContent>
        );
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1);
      } else if (e.key === 'ArrowLeft') {
        if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlide, slides.length]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setTimeout(() => {
      if (currentSlide < slides.length - 1) {
        setProgressKey(prev => prev + 1);
        setCurrentSlide(currentSlide + 1);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentSlide, isPaused, slides.length]);

  const handleTouchStart = (e) => {
    if (e.target.closest('button')) return; // ignore on buttons
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
    setIsPaused(true);
  };

  const handleTouchEnd = (e) => {
    if (e.target.closest('button')) return; // ignore on buttons
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime.current;
    const touchDistance = touchEndX - touchStartX.current;
    const screenWidth = window.innerWidth;
    const touchX = touchEndX;

    if (touchDuration < tapDurationThreshold && Math.abs(touchDistance) < 10) {
      if (touchX < screenWidth / 2) previousSlide(e);
      else nextSlide(e);
      setTimeout(() => setIsPaused(false), 100);
    } else if (Math.abs(touchDistance) > minSwipeDistance) {
      if (touchDistance > 0 && currentSlide > 0) previousSlide(e);
      else if (touchDistance < 0 && currentSlide < slides.length - 1) nextSlide(e);
      setTimeout(() => setIsPaused(false), 100);
    } else {
      setTimeout(() => setIsPaused(false), 200);
    }
  };

  return (
    <StoryContainer>
      <ProgressContainer>
        {[...Array(slides.length)].map((_, index) => (
          <ProgressSegment key={`${index}-${progressKey}`}>
            <ProgressFill
              initial={{ width: index < currentSlide ? '100%' : '0%' }}
              animate={{ width: index === currentSlide || index < currentSlide ? '100%' : '0%' }}
              transition={{ duration: index === currentSlide ? 5 : 0, ease: 'linear' }}
            />
          </ProgressSegment>
        ))}
      </ProgressContainer>
      <AnimatePresence mode="wait">
        <StoryCard
          key={currentSlide}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <ContentContainer>
            {renderSlideContent(slides[currentSlide])}
          </ContentContainer>
          <NavigationOverlay>
            <NavigationHalf onClick={previousSlide} />
            <NavigationHalf onClick={nextSlide} />
          </NavigationOverlay>
        </StoryCard>
      </AnimatePresence>
    </StoryContainer>
  );
};

export default Story;