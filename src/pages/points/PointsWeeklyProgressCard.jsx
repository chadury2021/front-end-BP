import React from 'react';
import PointsBuffCard from '@/pages/points/PointsBuffCard';
import WeeklyVolumeProgress from '@/pages/points/WeeklyVolumeProgress';

function PointsWeeklyProgressCard({ cardSx, boostPercentage, current, progress, target }) {
  const mergedCardSx = {
    p: 1.25,
    gap: 0.5,
    ...cardSx,
  };

  return (
    <PointsBuffCard cardOpacity={1} cardSx={mergedCardSx} maxHeight={70} minHeight={70} title='Weekly Volume Progress'>
      <WeeklyVolumeProgress
        disableWrapper
        boostPercentage={boostPercentage}
        contentGap={0.5}
        current={current}
        progress={progress}
        showLabel={false}
        target={target}
      />
    </PointsBuffCard>
  );
}

export default PointsWeeklyProgressCard;
