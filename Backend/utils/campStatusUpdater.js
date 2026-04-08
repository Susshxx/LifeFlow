const BloodCamp = require('../models/BloodCamp');

/**
 * Updates blood camp statuses based on current time
 * - Marks camps as 'completed' if their end time has passed
 * - Returns the number of camps updated
 */
async function updateCampStatuses() {
  try {
    const now = new Date();
    
    // Find all approved camps that should be completed
    const campsToComplete = await BloodCamp.find({
      status: 'approved',
    });

    let updatedCount = 0;

    for (const camp of campsToComplete) {
      // Calculate end time: startTime + duration (in hours)
      const endTime = new Date(camp.startTime);
      endTime.setHours(endTime.getHours() + camp.duration);

      // If current time is past the end time, mark as completed
      if (now > endTime) {
        camp.status = 'completed';
        await camp.save();
        updatedCount++;
        console.log(`✓ Camp "${camp.title}" marked as completed`);
      }
    }

    if (updatedCount > 0) {
      console.log(`✓ Updated ${updatedCount} camp(s) to completed status`);
    }

    return updatedCount;
  } catch (error) {
    console.error('Error updating camp statuses:', error);
    return 0;
  }
}

/**
 * Checks if a camp is currently active (ongoing)
 */
function isCampOngoing(camp) {
  const now = new Date();
  const startTime = new Date(camp.startTime);
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + camp.duration);

  return now >= startTime && now <= endTime;
}

/**
 * Checks if a camp is upcoming (not started yet)
 */
function isCampUpcoming(camp) {
  const now = new Date();
  const startTime = new Date(camp.startTime);
  return now < startTime;
}

/**
 * Checks if a camp is completed (past end time)
 */
function isCampCompleted(camp) {
  const now = new Date();
  const startTime = new Date(camp.startTime);
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + camp.duration);

  return now > endTime;
}

/**
 * Gets the dynamic status of a camp based on time
 */
function getCampDynamicStatus(camp) {
  if (camp.status === 'pending' || camp.status === 'rejected' || camp.status === 'cancelled') {
    return camp.status;
  }

  if (camp.status === 'completed') {
    return 'completed';
  }

  // For approved camps, determine if ongoing or upcoming
  if (isCampCompleted(camp)) {
    return 'completed';
  } else if (isCampOngoing(camp)) {
    return 'ongoing';
  } else if (isCampUpcoming(camp)) {
    return 'upcoming';
  }

  return camp.status;
}

module.exports = {
  updateCampStatuses,
  isCampOngoing,
  isCampUpcoming,
  isCampCompleted,
  getCampDynamicStatus,
};
