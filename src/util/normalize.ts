export const normalizeFile = (row: any) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    folderId: row.folder_id ?? row.folderId,
    workspaceId: row.workspace_id ?? row.workspaceId,
    iconId: row.icon_id ?? row.iconId,
    createdAt: row.created_at ?? row.createdAt,
    inTrash: row.in_trash ?? row.inTrash ?? null,
    bannerUrl: row.banner_url ?? row.bannerUrl,
    data: row.data ?? null,
  };
};

export const normalizeFolder = (row: any) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    iconId: row.icon_id ?? row.iconId,
    createdAt: row.created_at ?? row.createdAt,
    inTrash: row.in_trash ?? row.inTrash ?? null,
    workspaceId: row.workspace_id ?? row.workspaceId,
    bannerUrl: row.banner_url ?? row.bannerUrl,
    data: row.data ?? null,
    files: (row.files ?? []).map(normalizeFile),
  };
};

export const normalizeWorkspace = (row: any) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    iconId: row.icon_id ?? row.iconId,
    createdAt: row.created_at ?? row.createdAt,
    bannerUrl: row.banner_url ?? row.bannerUrl,
    data: row.data ?? null,
  };
};

export const normalizeUser = (u: any) => {
  if (!u) return null;

  return {
    id: u.id,
    email: u.email ?? u.email_address ?? null,
    fullName: u.full_name ?? u.fullName ?? null,
    avatarUrl: u.avatar_url ?? u.avatarUrl ?? null,
    billingAddress: u.billing_address ?? u.billingAddress ?? null,
    updatedAt: u.updated_at ?? u.updatedAt ?? null,
    paymentMethod: u.payment_method ?? u.paymentMethod ?? null,
  };
};