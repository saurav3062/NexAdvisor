"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Workspace, card, input, button } from "@/features/shared/Workspace";
export function Profile() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const save = useMutation({
    mutationFn: () => updateProfile({ name, bio, location }),
  });
  return (
    <Workspace title="Your profile">
      <Link
        className="text-blue-600 inline-block mb-4"
        href="/privacy-requests"
      >
        Privacy & account closure
      </Link>
      <p className="mb-6 max-w-2xl text-slate-600">
        {user?.role === "expert"
          ? "Keep your personal details up to date. Your portrait, professional bio and schedule live in your expert profile."
          : "Tell your expert a little about yourself and what you hope to achieve. Your bio and location are optional."}
      </p>
      {user?.role === "expert" && (
        <Link
          href="/expert-onboarding"
          className="mb-6 inline-block text-sm font-semibold text-blue-600"
        >
          Edit expert profile & photo →
        </Link>
      )}
      <form
        className={card + " max-w-2xl space-y-4"}
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <p>
          {user?.email} · {user?.role}
        </p>
        <label className="block">
          Name
          <input
            required
            maxLength={100}
            className={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block">
          Location
          <input
            maxLength={150}
            className={input}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </label>
        <label className="block">
          Bio
          <textarea
            maxLength={2000}
            className={input}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </label>
        <button className={button} disabled={save.isPending}>
          Save profile
        </button>
        {save.isSuccess && (
          <p role="status" className="text-green-700">
            Profile saved.
          </p>
        )}
        {save.isSuccess && (
          <Link
            href="/dashboard"
            className="block text-sm font-semibold text-blue-600"
          >
            Continue to dashboard →
          </Link>
        )}
        {save.error && (
          <p role="alert" className="text-red-600">
            {save.error.message}
          </p>
        )}
      </form>
    </Workspace>
  );
}
