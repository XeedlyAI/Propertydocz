/**
 * In-memory Supabase stand-in for unit tests — @xeedlyai/kit (canonical copy;
 * apps receive it under src/kit/ via bin/sync.mjs and must never edit it there).
 *
 * Covers the PostgREST query surface the XeedlyAI apps use:
 * from · select (incl. `{ count, head }`) · insert · update · upsert · delete ·
 * eq · neq · in · gt · gte · lt · lte · is · not · or · ilike · order · limit · range ·
 * single · maybeSingle · then (thenable, so `await` and `.then()` both work) · rpc.
 *
 * Reads return the FULL fixture row regardless of the projection string, so a
 * fixture that needs an embedded relation (e.g. `communities(name)`) just
 * carries `communities: { name }` on the row. Writes mutate the table in place
 * and are recorded on `writes` so a test can assert what was persisted.
 *
 *   const db = createFakeSupabase({ communities: [{ id: "c1", name: "A" }] });
 *   await fn(db.client as unknown as SupabaseClient, ...);
 *   expect(db.writes).toContainEqual({ table: "signals", op: "insert", ... });
 *
 * Contract tests: fake-supabase.test.ts (kept next to this file in the kit).
 */

export type Row = Record<string, unknown>;
export type FakeDb = Record<string, Row[]>;

type Filter = (row: Row) => boolean;
type Order = { column: string; ascending: boolean };

export interface FakeWrite {
  table: string;
  op: "insert" | "update" | "upsert" | "delete";
  values: Row | Row[] | null;
  /** number of rows the write touched */
  affected: number;
}

interface Result<T = Row[] | Row | null> {
  data: T;
  error: { message: string } | null;
  count: number | null;
}

const cmp = (a: unknown, b: unknown): number => {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
};

class FakeQuery implements PromiseLike<Result> {
  private filters: Filter[] = [];
  private orders: Order[] = [];
  private limitN: number | null = null;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private mode: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: Row | Row[] | null = null;
  private wantSingle = false;
  private maybe = false;
  private countMode: "exact" | null = null;
  private head = false;

  constructor(
    private readonly db: FakeDb,
    private readonly table: string,
    private readonly writes: FakeWrite[],
  ) {}

  // ── verbs ────────────────────────────────────────────────────────────
  select(_columns?: string, opts?: { count?: "exact" | "planned" | "estimated"; head?: boolean }) {
    if (this.mode === "select") {
      if (opts?.count) this.countMode = "exact";
      if (opts?.head) this.head = true;
    }
    return this;
  }
  insert(values: Row | Row[]) {
    this.mode = "insert";
    this.payload = values;
    return this;
  }
  upsert(values: Row | Row[]) {
    this.mode = "upsert";
    this.payload = values;
    return this;
  }
  update(values: Row) {
    this.mode = "update";
    this.payload = values;
    return this;
  }
  delete() {
    this.mode = "delete";
    return this;
  }

  // ── filters ──────────────────────────────────────────────────────────
  eq(col: string, v: unknown) {
    this.filters.push((r) => r[col] === v);
    return this;
  }
  neq(col: string, v: unknown) {
    this.filters.push((r) => r[col] !== v);
    return this;
  }
  in(col: string, vs: unknown[]) {
    this.filters.push((r) => vs.includes(r[col]));
    return this;
  }
  gt(col: string, v: unknown) {
    this.filters.push((r) => cmp(r[col], v) > 0);
    return this;
  }
  gte(col: string, v: unknown) {
    this.filters.push((r) => cmp(r[col], v) >= 0);
    return this;
  }
  lt(col: string, v: unknown) {
    this.filters.push((r) => cmp(r[col], v) < 0);
    return this;
  }
  lte(col: string, v: unknown) {
    this.filters.push((r) => cmp(r[col], v) <= 0);
    return this;
  }
  is(col: string, v: null | boolean) {
    this.filters.push((r) => (v === null ? r[col] == null : r[col] === v));
    return this;
  }
  /** `.not(col, "is", null)` and `.not(col, "eq", v)` — the two forms in use. */
  not(col: string, op: string, v: unknown) {
    if (op === "is") this.filters.push((r) => (v === null ? r[col] != null : r[col] !== v));
    else if (op === "eq") this.filters.push((r) => r[col] !== v);
    else if (op === "in") {
      // Accepts an array or PostgREST's string form: ("a","b")
      const list = Array.isArray(v) ? v : String(v).replace(/^\(|\)$/g, "").split(",").map((x) => x.trim().replace(/^"|"$/g, ""));
      this.filters.push((r) => !list.includes(r[col]));
    } else throw new Error(`fake-supabase: unsupported not() operator ${op}`);
    return this;
  }
  /** PostgREST or(): "col.op.value,col.op.value" with eq/neq/gt/gte/lt/lte/is. */
  or(expr: string) {
    const clauses = expr.split(",").map((c) => {
      const [col, op, ...rest] = c.trim().split(".");
      const raw = rest.join(".");
      const v: unknown = raw === "null" ? null : raw === "true" ? true : raw === "false" ? false : raw;
      const test = (r: Row): boolean => {
        const x = r[col];
        switch (op) {
          case "eq": return x === v || String(x) === String(v);
          case "neq": return !(x === v || String(x) === String(v));
          case "gt": return cmp(x, v) > 0;
          case "gte": return cmp(x, v) >= 0;
          case "lt": return x != null && cmp(x, v) < 0;
          case "lte": return x != null && cmp(x, v) <= 0;
          case "is": return v === null ? x == null : x === v;
          default: throw new Error(`fake-supabase: unsupported or() operator ${op}`);
        }
      };
      return test;
    });
    this.filters.push((r) => clauses.some((t) => t(r)));
    return this;
  }
  /** PostgREST ilike: % wildcard, case-insensitive. */
  ilike(col: string, pattern: string) {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*");
    const re = new RegExp("^" + escaped + "$", "i");
    this.filters.push((r) => re.test(String(r[col] ?? "")));
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ column: col, ascending: opts?.ascending ?? true });
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }
  single() {
    this.wantSingle = true;
    return this;
  }
  maybeSingle() {
    this.maybe = true;
    return this;
  }

  // ── execution ────────────────────────────────────────────────────────
  private rows(): Row[] {
    return this.db[this.table] ?? (this.db[this.table] = []);
  }
  private matching(): Row[] {
    return this.rows().filter((r) => this.filters.every((f) => f(r)));
  }

  /** Apply single()/maybeSingle() shaping to a result set (reads and writes alike). */
  private shape(out: Row[], count: number | null): Result {
    if (this.head) return { data: null, error: null, count };
    if (this.wantSingle) {
      if (out.length !== 1) return { data: null, error: { message: `single(): expected 1 row, got ${out.length}` }, count };
      return { data: out[0], error: null, count };
    }
    if (this.maybe) {
      if (out.length > 1) return { data: null, error: { message: `maybeSingle(): got ${out.length} rows` }, count };
      return { data: out[0] ?? null, error: null, count };
    }
    return { data: out, error: null, count };
  }

  private run(): Result {
    if (this.mode === "insert" || this.mode === "upsert") {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload as Row];
      const copies = list.map((r) => ({ ...r }));
      this.rows().push(...copies);
      this.writes.push({ table: this.table, op: this.mode, values: this.payload, affected: copies.length });
      return this.shape(copies.map((r) => ({ ...r })), null);
    }
    if (this.mode === "update") {
      const hit = this.matching();
      for (const r of hit) Object.assign(r, this.payload);
      this.writes.push({ table: this.table, op: "update", values: this.payload, affected: hit.length });
      return this.shape(hit.map((r) => ({ ...r })), null);
    }
    if (this.mode === "delete") {
      const hit = new Set(this.matching());
      this.db[this.table] = this.rows().filter((r) => !hit.has(r));
      this.writes.push({ table: this.table, op: "delete", values: null, affected: hit.size });
      return this.shape([...hit], null);
    }

    let out = this.matching().map((r) => ({ ...r }));
    for (const o of [...this.orders].reverse()) {
      out.sort((a, b) => (o.ascending ? 1 : -1) * cmp(a[o.column], b[o.column]));
    }
    const total = out.length;
    if (this.rangeFrom != null && this.rangeTo != null) out = out.slice(this.rangeFrom, this.rangeTo + 1);
    if (this.limitN != null) out = out.slice(0, this.limitN);

    return this.shape(out, this.countMode ? total : null);
  }

  then<R1 = Result, R2 = never>(
    onfulfilled?: ((value: Result) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return Promise.resolve().then(() => this.run()).then(onfulfilled, onrejected);
  }
}

export function createFakeSupabase(seed: FakeDb = {}) {
  const db: FakeDb = {};
  for (const [t, rows] of Object.entries(seed)) db[t] = rows.map((r) => ({ ...r }));
  const writes: FakeWrite[] = [];
  const rpcCalls: Array<{ fn: string; args: Row | undefined }> = [];
  const client = {
    from: (table: string) => new FakeQuery(db, table, writes),
    rpc: async (fn: string, args?: Row) => {
      rpcCalls.push({ fn, args });
      return { data: null, error: null };
    },
  };
  return { client, db, writes, rpcCalls };
}

export type FakeSupabase = ReturnType<typeof createFakeSupabase>;
