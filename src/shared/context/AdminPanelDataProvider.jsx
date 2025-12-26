import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  addTradingGroupCredentials,
  createUser,
  createTradingGroup,
  deleteTradingGroup,
  getUsers,
  getAccounts,
  getAdminAccounts,
  getTradingGroups,
  removeGroupMember,
  removeTradingGroupCredentials,
  deleteUser as apiDeleteUser,
  updateGroupMember,
  updateTradingGroup,
  upsertGroupMember,
  updateUser,
  getOpenOrders,
} from '@/apiServices';

const AdminPanelDataContext = createContext();

const DEFAULT_OPEN_ORDERS_OPTIONS = {
  exclude_paused: false,
  include_conditions: true,
  include_fills: false,
  include_meta: false,
};

export function AdminPanelDataProvider({ children }) {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [groupsResp, usersResp, accountsResp, openOrdersResp] = await Promise.all([
        getTradingGroups(),
        getUsers({ include_memberships: true }),
        getAdminAccounts(),
        getOpenOrders(DEFAULT_OPEN_ORDERS_OPTIONS),
      ]);
      setGroups(groupsResp || []);
      setUsers(usersResp || []);
      setAccounts(accountsResp || []);
      if (openOrdersResp?.orders) {
        setOpenOrders(openOrdersResp.orders);
      }
    } catch (e) {
      setError(e?.message || 'Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createGroup = useCallback(
    async ({ name, description, accountIds = [], initialMembers = [] }) => {
      await createTradingGroup({
        name,
        description,
        exchange_credential_ids: accountIds,
        memberships: initialMembers,
      });
      await load();
    },
    [load]
  );

  const patchGroup = useCallback(
    async (groupId, updates) => {
      await updateTradingGroup(groupId, updates);
      await load();
    },
    [load]
  );

  const attachCredentials = useCallback(
    async (groupId, exchangeCredentialIds) => {
      await addTradingGroupCredentials(groupId, exchangeCredentialIds);
      await load();
    },
    [load]
  );

  const detachCredentials = useCallback(
    async (groupId, exchangeCredentialIds) => {
      await removeTradingGroupCredentials(groupId, exchangeCredentialIds);
      await load();
    },
    [load]
  );

  const removeGroup = useCallback(
    async (groupId) => {
      await deleteTradingGroup(groupId);
      await load();
    },
    [load]
  );

  const addOrUpdateMember = useCallback(
    async ({ groupId, userId, permissions }) => {
      await upsertGroupMember(groupId, userId, permissions);
      await load();
    },
    [load]
  );

  const setMemberPermissions = useCallback(
    async ({ groupId, userId, permissions }) => {
      await updateGroupMember(groupId, userId, permissions);
      await load();
    },
    [load]
  );

  const removeMember = useCallback(
    async ({ groupId, userId }) => {
      await removeGroupMember(groupId, userId);
      await load();
    },
    [load]
  );

  const editUser = useCallback(
    async ({ user_id, changes }) => {
      await updateUser(user_id, changes);
      await load();
    },
    [load]
  );

  const deleteUser = useCallback(
    async ({ userId }) => {
      await apiDeleteUser(userId);
      await load();
    },
    [load]
  );

  const reloadOpenOrders = useCallback(
    async (
      options = {
        exclude_paused: DEFAULT_OPEN_ORDERS_OPTIONS.exclude_paused,
        include_conditions: DEFAULT_OPEN_ORDERS_OPTIONS.include_conditions,
        include_fills: DEFAULT_OPEN_ORDERS_OPTIONS.include_fills,
        include_meta: DEFAULT_OPEN_ORDERS_OPTIONS.include_meta,
      }
    ) => {
      try {
        const mergedOptions = {
          ...DEFAULT_OPEN_ORDERS_OPTIONS,
          ...(options || {}),
        };
        const resp = await getOpenOrders(mergedOptions);
        if (resp?.orders) {
          setOpenOrders(resp.orders);
        }
      } catch (e) {
        // silent during background polling
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      groups,
      users,
      accounts,
      openOrders,
      isLoading,
      error,
      reload: load,
      reloadOpenOrders,
      createUser,
      editUser,
      deleteUser,
      createGroup,
      patchGroup,
      removeGroup,
      addOrUpdateMember,
      setMemberPermissions,
      removeMember,
      attachCredentials,
      detachCredentials,
    }),
    [
      groups,
      users,
      accounts,
      openOrders,
      isLoading,
      error,
      load,
      reloadOpenOrders,
      createGroup,
      patchGroup,
      removeGroup,
      addOrUpdateMember,
      setMemberPermissions,
      removeMember,
      deleteUser,
      attachCredentials,
      detachCredentials,
    ]
  );

  return <AdminPanelDataContext.Provider value={value}>{children}</AdminPanelDataContext.Provider>;
}

export const useAdminPanelData = () => useContext(AdminPanelDataContext);
