import { useState } from "react";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

const categories = [
  { id: "all", label: "All" },
  { id: "room", label: "Room", image: "/rooms.png" },
  { id: "house", label: "House", image: "/Houses.png" },
  { id: "apartment", label: "Apartment", image: "/apartments.png" },
  { id: "plot", label: "Plot", image: "/commercial.png" },
  { id: "mbashu", label: "Ghetto/Mbashu", image: "/ghetto.png" },
  { id: "commercial", label: "Commercial", image: "/commercial.png" },
  { id: "guesthouse", label: "Guest House", image: "/guesthouse.png" },
  { id: "office-space", label: "Office Space", image: "/office.png" },
  { id: "student-accommodation", label: "Student Accommodation", image: "/student.png" },
];

const CategoryTabs = () => {
  const [active, setActive] = useState("all");

  return (
    <div className="px-4 py-2 md:px-0 md:py-4">
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 md:flex-wrap md:overflow-x-visible md:justify-center">
        {categories.map((category) => {
          const isActive = active === category.id;

          return (
            <button
              key={category.id}
              onClick={() => setActive(category.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]",
                isActive
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              )}
            >
              {category.image ? (
                <img src={category.image} alt="" className="h-5 w-5 object-contain" loading="lazy" />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryTabs;
