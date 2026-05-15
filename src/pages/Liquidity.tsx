export default function Liquidity() {
  return (
    <div className="min-h-screen p-8 text-white">
      <h1 className="text-4xl font-bold mb-4">Liquidity</h1>
      <p className="text-slate-400 mb-8">
        Create and manage liquidity pools for Potra.
      </p>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 max-w-2xl">
        <div className="grid gap-4">
          <input className="rounded-xl bg-slate-950 border border-slate-800 p-4" placeholder="Token A" />
          <input className="rounded-xl bg-slate-950 border border-slate-800 p-4" placeholder="Token B" />
          <input className="rounded-xl bg-slate-950 border border-slate-800 p-4" placeholder="Amount A" />
          <input className="rounded-xl bg-slate-950 border border-slate-800 p-4" placeholder="Amount B" />

          <button className="rounded-xl bg-blue-600 hover:bg-blue-500 transition p-4 font-semibold">
            Create Pool
          </button>
        </div>
      </div>
    </div>
  );
}
