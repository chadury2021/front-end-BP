// VERSION: v6.1.39
// IMPORTANT: When updating taas_app version data, update the version number in this comment on the first line
// This version number is used by the backend API endpoint get_VersionData
export const versionContentData = {
  date: "November 26, 2025",
  marketAccessVersion: "v6.1.206",
  features: [
    {
      title: "New",
      items: [
        {
          title: "Market Maker bot reaction time control",
          description:
            "New 'reaction time' parameter lets you control how aggressively the Market Maker bot chases quotes."
        },
        {
          title: "Points Season 1 UI upgrade",
          description:
            "Refreshed Points Season 1 interface with clearer layouts and improved interactions."
        }
      ]
    },
    {
      title: "Improvements",
      items: [
        {
          title: "Server performance upgrades",
          description:
            "Backend optimizations to reduce latency and improve overall system responsiveness."
        }
      ]
    },
    {
      title: "Fixes",
      items: [
        {
          title: "Binance available balance accuracy",
          description:
            "Available balances for Binance now correctly account for open positions."
        },
        {
          title: "Order table filtering",
          description:
            "Fixed inconsistencies with order table filters so results stay in sync with your selections."
        }
      ]
    }
  ]
};
