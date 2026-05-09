"use client";

// / — Pagina de login/registro. Redireciona conforme role apos autenticar.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { login, register } from "@/lib/api/auth";
import { seedDemo } from "@/lib/api/citizen";
import {
  getStoredAuth,
  setStoredAuth,
  clearStoredAuth,
  type StoredAuth,
} from "@/lib/auth-storage";
import { setStoredCitizen } from "@/lib/citizen-storage";
import type { UserRole } from "@/types";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [role, setRole] = useState<UserRole>("cidadao");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Verifica se ja esta logado
  useEffect(() => {
    const stored = getStoredAuth();
    if (stored) {
      redirectByRole(stored.role);
    } else {
      // Garante seed pra ter usuarios default
      seedDemo().catch(() => {});
      setChecking(false);
    }
  }, []);

  function redirectByRole(r: UserRole) {
    if (r === "funcionario") {
      router.replace("/dashboard");
    } else {
      router.replace("/app");
    }
  }

  async function handleSubmit() {
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let result;
      if (mode === "login") {
        result = await login(username.trim(), password.trim());
      } else {
        if (!displayName.trim()) {
          setError("Preencha seu nome.");
          setLoading(false);
          return;
        }
        result = await register({
          username: username.trim(),
          password: password.trim(),
          role,
          displayName: displayName.trim(),
          neighborhood: neighborhood.trim() || undefined,
        });
      }

      const auth: StoredAuth = {
        token: result.token,
        role: result.role,
        displayName: result.displayName,
        userId: result.userId,
        citizenId: result.citizenId,
      };
      setStoredAuth(auth);

      // Se cidadao, setar tambem no citizen-storage (compatibilidade)
      if (result.role === "cidadao" && result.citizenId) {
        setStoredCitizen(result.citizenId, result.displayName);
      }

      redirectByRole(result.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-bg">
        <div className="flex flex-col items-center gap-3">
          <span className="text-3xl">🌱</span>
          <span className="font-mono text-xs text-text-secondary">
            verificando sessao...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-brand-green">
            JAZIDA AI
          </p>
          <h1
            className="mt-2 text-3xl font-bold text-text-primary"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Sua voz, sua cidade,
            <br />
            suas oportunidades.
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Plataforma de inteligencia comunitaria para cidades-mineracao.
          </p>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          {/* Tab login/registro */}
          <div className="grid grid-cols-2 rounded-2xl bg-brand-bg p-1">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className={
                mode === "login"
                  ? "rounded-xl bg-white px-4 py-2 text-sm font-semibold text-text-primary shadow-sm"
                  : "rounded-xl px-4 py-2 text-sm font-medium text-text-secondary"
              }
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); }}
              className={
                mode === "register"
                  ? "rounded-xl bg-white px-4 py-2 text-sm font-semibold text-text-primary shadow-sm"
                  : "rounded-xl px-4 py-2 text-sm font-medium text-text-secondary"
              }
            >
              Criar conta
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-text-primary">
              Usuario
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: maria"
                className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-base focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                autoComplete="username"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-text-primary">
              Senha
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="****"
                className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-base focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </label>

            <AnimatePresence>
              {mode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-3 overflow-hidden"
                >
                  <label className="flex flex-col gap-1 text-sm font-medium text-text-primary">
                    Seu nome completo
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="ex: Maria Aparecida"
                      className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-base focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm font-medium text-text-primary">
                    Bairro{" "}
                    <span className="text-xs text-text-secondary">(opcional)</span>
                    <input
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="ex: Centro"
                      className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-base focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    />
                  </label>

                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Eu sou:
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole("cidadao")}
                        className={
                          role === "cidadao"
                            ? "flex flex-col items-center gap-1 rounded-xl border-2 border-brand-green bg-brand-green/5 p-3 text-sm font-semibold text-brand-green"
                            : "flex flex-col items-center gap-1 rounded-xl border-2 border-gray-200 p-3 text-sm text-text-primary hover:border-brand-green/50"
                        }
                      >
                        <span className="text-2xl">🏠</span>
                        Cidadao
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("funcionario")}
                        className={
                          role === "funcionario"
                            ? "flex flex-col items-center gap-1 rounded-xl border-2 border-brand-green bg-brand-green/5 p-3 text-sm font-semibold text-brand-green"
                            : "flex flex-col items-center gap-1 rounded-xl border-2 border-gray-200 p-3 text-sm text-text-primary hover:border-brand-green/50"
                        }
                      >
                        <span className="text-2xl">🏢</span>
                        Funcionario
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !username.trim() || !password.trim()}
              className="mt-1 flex min-h-[56px] items-center justify-center rounded-2xl bg-brand-green px-4 text-base font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? "Aguarde..."
                : mode === "login"
                  ? "Entrar"
                  : "Criar conta"}
            </button>
          </div>
        </div>

        {/* Info de demo */}
        <div className="mt-4 rounded-2xl bg-white p-4 text-xs text-text-secondary">
          <p className="font-semibold text-text-primary">Contas de demo:</p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            <span>
              <strong>admin</strong> / admin123
            </span>
            <span className="text-brand-green">funcionario</span>
            <span>
              <strong>maria</strong> / 1234
            </span>
            <span className="text-brand-green">cidadao</span>
            <span>
              <strong>joao</strong> / 1234
            </span>
            <span className="text-brand-green">cidadao</span>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
