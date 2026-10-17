"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Hero } from "../components/home/Hero";
import { FeaturedExperts } from "@/features/experts/ExpertDirectory";
import { WhyChooseUs } from "../components/home/WhyChooseUs";
import { HowItWorks } from "../components/home/HowItWorks";
import { CTASection } from "../components/home/CTASection";
import { useQuery } from "@tanstack/react-query";
import { api, type Category } from "@/lib/nexadvisor-api";

export function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });
  const router = useRouter();

  function setCurrentTab(tab: string) {
    if (tab !== "experts") return;
    const params = new URLSearchParams({ search: searchQuery });
    const category = categories.data?.find((c) => c.name === selectedCategory);
    if (category) params.set("category", category.id);
    router.push("/experts?" + params);
  }

  const handleSignup = () => {
    router.push("/signup");
  };

  const categoryNames = [
    "All Categories",
    ...(categories.data?.map((c) => c.name) ?? []),
  ];

  return (
    <div>
      <Hero
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setCurrentTab={setCurrentTab}
        categories={categoryNames}
      />
      <FeaturedExperts />
      <WhyChooseUs />
      <HowItWorks />
      <CTASection onSignup={handleSignup} />
    </div>
  );
}
