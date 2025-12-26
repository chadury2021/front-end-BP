// Mock leaderboard data for frontend development
// This file will be removed once backend API is ready

// Generate a random trader ID (full format for searching, truncated for display)
const generateTraderId = (index) => {
  // Create a more varied hex string for better searchability
  const hex1 = index.toString(16).padStart(8, '0');
  const hex2 = (index * 7).toString(16).padStart(8, '0');
  const hex3 = (index * 13).toString(16).padStart(8, '0');
  // Full ID for searching
  return `0x${hex1}${hex2}${hex3}${hex1.slice(0, 8)}`;
};

// Generate mock leaderboard rows
const generateMockRows = (count, myTraderId, myRank) => {
  const rows = [];
  for (let i = 1; i <= count; i += 1) {
    const isMyRow = i === myRank;
    const baseVolume = 10000000 - (i - 1) * 300000; // Decreasing volume
    const lifetimeVolume = baseVolume + Math.random() * 500000; // Add some randomness
    const volume7d = lifetimeVolume * (0.1 + Math.random() * 0.2); // 7D volume is 10-30% of lifetime
    const adjustedVolume = lifetimeVolume * (1.1 + Math.random() * 0.3); // Adjusted volume with boosters
    const pnl = lifetimeVolume * (0.1 + Math.random() * 0.3); // PnL is 10-40% of volume

    rows.push({
      rank: i,
      trader_id: isMyRow ? myTraderId : generateTraderId(i),
      volume: Math.round(lifetimeVolume * 100) / 100, // Keep for backward compatibility
      lifetime_volume: Math.round(lifetimeVolume * 100) / 100, // Same as orders_value from transaction_costs
      orders_value: Math.round(lifetimeVolume * 100) / 100, // Same as lifetime_volume
      volume_7d: Math.round(volume7d * 100) / 100,
      boosted_volume: Math.round(adjustedVolume * 100) / 100,
      adjusted_volume: Math.round(adjustedVolume * 100) / 100, // Keep for backward compatibility
      pnl_30d: Math.round(pnl * 100) / 100,
      is_current_user: isMyRow,
    });
  }
  return rows;
};

// Your user data
const MY_TRADER_ID = '0xb34a7c8d9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6';
const MY_RANK = 123;
const MY_PNL_30D = 5201244.34;
const MY_VOLUME_30D = 10201244.34;

// Generate 200 rows for realistic pagination testing
const TOTAL_ROWS = 200;
const mockRows = generateMockRows(TOTAL_ROWS, MY_TRADER_ID, MY_RANK);

const MY_VOLUME_7D = MY_VOLUME_30D * 0.3; // 7D volume is approximately 30% of 30D volume
const MY_BOOSTED_VOLUME = MY_VOLUME_7D * 1.4; // Boosted volume with multipliers

  // Ensure your row is in the data
  const myRowIndex = mockRows.findIndex((row) => row.rank === MY_RANK);
  if (myRowIndex === -1) {
    // If your rank is beyond the generated rows, add it
    const myLifetimeVolume = MY_VOLUME_30D * 10; // Estimate lifetime volume
    mockRows.push({
      rank: MY_RANK,
      trader_id: MY_TRADER_ID,
      volume: MY_VOLUME_30D, // Keep for backward compatibility
      lifetime_volume: myLifetimeVolume,
      orders_value: myLifetimeVolume,
      volume_7d: MY_VOLUME_7D, // Use MY_VOLUME_7D instead of MY_VOLUME_30D
      boosted_volume: MY_BOOSTED_VOLUME, // Use MY_BOOSTED_VOLUME instead of calculated value
      adjusted_volume: MY_BOOSTED_VOLUME, // Keep for backward compatibility
      pnl_30d: MY_PNL_30D,
      is_current_user: true,
    });
    // Sort by rank
    mockRows.sort((a, b) => a.rank - b.rank);
  }

export const mockLeaderboardData = {
  my_rank: MY_RANK,
  my_trader_id: MY_TRADER_ID,
  my_pnl_30d: MY_PNL_30D,
  my_volume_30d: MY_VOLUME_30D,
  my_volume_7d: MY_VOLUME_7D,
  my_boosted_volume: MY_BOOSTED_VOLUME,
  leaderboard_rows: mockRows,
  total_count: TOTAL_ROWS,
};

// Helper function to filter and paginate mock data
export const getMockLeaderboardData = (page, pageSize, search) => {
  let filteredRows = [...mockRows];

  // Apply search filter if provided
  if (search && search.trim()) {
    const searchLower = search.toLowerCase().trim();
    // Remove '0x' prefix if user includes it, and search in the full trader_id
    const searchTerm = searchLower.startsWith('0x') ? searchLower.slice(2) : searchLower;
    filteredRows = filteredRows.filter((row) => {
      const traderIdLower = row.trader_id.toLowerCase();
      // Search in full ID (without 0x prefix for comparison)
      const idWithoutPrefix = traderIdLower.startsWith('0x') ? traderIdLower.slice(2) : traderIdLower;
      // Also check if search matches the truncated display format
      const truncatedId = `${traderIdLower.replace('0x', '').slice(0, 8)}...${traderIdLower.slice(-6)}`;
      return idWithoutPrefix.includes(searchTerm) || truncatedId.includes(searchTerm);
    });
  }

  // Calculate pagination
  const totalCount = filteredRows.length;
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  return {
    my_rank: MY_RANK,
    my_trader_id: MY_TRADER_ID,
    my_pnl_30d: MY_PNL_30D,
    my_volume_30d: MY_VOLUME_30D,
    my_volume_7d: MY_VOLUME_7D,
    my_boosted_volume: MY_BOOSTED_VOLUME,
    leaderboard_rows: paginatedRows,
    total_count: totalCount,
  };
};

