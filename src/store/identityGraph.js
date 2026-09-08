/**
 * IdentityGraph manages alias mapping and transitive linking of guest identities to user accounts.
 */
export class IdentityGraph {
  constructor() {
    // parent pointers: childId -> parentId
    this.parent = new Map();
    // children reverse mapping: parentId -> Set(childId)
    this.children = new Map();
  }

  /**
   * Links a guest identity to a user identity.
   */
  link(guestId, userId) {
    if (!guestId || !userId || guestId === userId) return;

    const canonGuest = this.getCanonicalId(guestId);
    const canonUser = this.getCanonicalId(userId);

    if (canonGuest === canonUser) return;

    // Direct guest to user
    this.parent.set(guestId, canonUser);
    this.parent.set(canonGuest, canonUser);

    if (!this.children.has(canonUser)) {
      this.children.set(canonUser, new Set());
    }
    this.children.get(canonUser).add(guestId);
    this.children.get(canonUser).add(canonGuest);
  }

  /**
   * Resolves any given ID to its canonical root ID.
   */
  getCanonicalId(id) {
    if (!id) return id;
    let curr = id;
    const visited = new Set([curr]);

    while (this.parent.has(curr)) {
      const next = this.parent.get(curr);
      if (visited.has(next)) break; // cycle protection
      visited.add(next);
      curr = next;
    }

    // Path compression
    if (curr !== id) {
      this.parent.set(id, curr);
    }
    return curr;
  }

  /**
   * Returns all known aliases associated with this canonical ID.
   */
  getAllAssociatedIds(id) {
    const canon = this.getCanonicalId(id);
    const associated = new Set([id, canon]);
    if (this.children.has(canon)) {
      for (const child of this.children.get(canon)) {
        associated.add(child);
      }
    }
    return Array.from(associated);
  }

  /**
   * Checks whether a link already exists.
   */
  hasLink(guestId, userId) {
    return this.getCanonicalId(guestId) === this.getCanonicalId(userId);
  }

  clear() {
    this.parent.clear;
    this.parent = new Map();
    this.children = new Map();
  }
}
