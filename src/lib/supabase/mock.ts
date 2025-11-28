class MockQueryBuilder<T = unknown> {
  private resultData: T | T[] | null

  constructor(initialData: T | T[] | null = []) {
    this.resultData = Array.isArray(initialData) ? [...initialData] : initialData
  }

  select(): this {
    return this
  }

  insert(): this {
    return this
  }

  update(): this {
    return this
  }

  upsert(): this {
    return this
  }

  delete(): this {
    return this
  }

  eq(): this {
    return this
  }

  neq(): this {
    return this
  }

  in(): this {
    return this
  }

  is(): this {
    return this
  }

  order(): this {
    return this
  }

  range(): this {
    return this
  }

  limit(): this {
    return this
  }

  gte(): this {
    return this
  }

  lte(): this {
    return this
  }

  like(): this {
    return this
  }

  ilike(): this {
    return this
  }

  single(): this {
    if (Array.isArray(this.resultData)) {
      this.resultData = this.resultData[0] ?? null
    }
    return this
  }

  maybeSingle(): this {
    return this.single()
  }

  /**
   * Allow `await` on the query builder by forwarding to a resolved promise.
   */
  then<TResult1 = { data: T | T[] | null; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | T[] | null; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve({ data: this.resultData ?? [], error: null }).then(onfulfilled, onrejected)
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
  ): Promise<{ data: T | T[] | null; error: null } | TResult> {
    return Promise.resolve({ data: this.resultData ?? [], error: null }).catch(onrejected)
  }

  finally(onfinally?: (() => void) | null): Promise<{ data: T | T[] | null; error: null }> {
    return Promise.resolve({ data: this.resultData ?? [], error: null }).finally(onfinally ?? undefined)
  }
}

const logMockUsage = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[supabase-mock]", ...args)
  }
}

export function createMockSupabaseClient() {
  return {
    from(table: string) {
      logMockUsage(`supabase.from("${table}") hit mock client`)
      return new MockQueryBuilder()
    },
    rpc(fnName: string) {
      logMockUsage(`supabase.rpc("${fnName}") hit mock client`)
      return Promise.resolve({ data: null, error: null })
    },
    auth: {
      async getUser() {
        logMockUsage("supabase.auth.getUser resolved with null user")
        return { data: { user: null }, error: null }
      },
      async signOut() {
        logMockUsage("supabase.auth.signOut skipped (mock)")
        return { error: null }
      },
      async signInWithOAuth() {
        logMockUsage("supabase.auth.signInWithOAuth skipped (mock)")
        return { data: null, error: null }
      },
      async signInWithPassword() {
        logMockUsage("supabase.auth.signInWithPassword skipped (mock)")
        return { data: null, error: null }
      },
      async exchangeCodeForSession() {
        logMockUsage("supabase.auth.exchangeCodeForSession skipped (mock)")
        return { data: null, error: null }
      },
    },
  }
}


