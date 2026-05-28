import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const accommodationTypes = [
  { id: "house", label: "House", image: "/Houses.png", tint: "bg-blue-50/80", modes: ["buy", "rent"] },
  { id: "apartment", label: "Apartment", image: "/apartments.png", tint: "bg-green-50/80", modes: ["buy", "rent"] },
  { id: "plot", label: "Plot", image: "/commercial.png", tint: "bg-lime-50/80", modes: ["buy"] },
  { id: "room", label: "Room", image: "/rooms.png", tint: "bg-purple-50/80", modes: ["rent"] },
  { id: "guesthouse", label: "Guest House", image: "/guesthouse.png", tint: "bg-orange-50/80", modes: ["rent"] },
  { id: "office-space", label: "Office Space", image: "/office.png", tint: "bg-red-50/80", modes: ["rent"] },
  { id: "student-accommodation", label: "Student Accommodation", image: "/student.png", tint: "bg-emerald-50/80", modes: ["rent"] },
  { id: "commercial", label: "Commercial", image: "/commercial.png", tint: "bg-teal-50/80", modes: ["buy", "rent"] },
  { id: "mbashu", label: "Ghetto/Mbashu", image: "/ghetto.png", tint: "bg-indigo-50/80", modes: ["rent"] },
];

const AccommodationTypes = () => {
  const navigate = useNavigate();
  const { listingMode } = useLanguage();

  const handleTypeClick = (typeId: string) => {
    navigate(`/?mode=${listingMode}&type=${typeId}`);
  };

  return (
    <div className="px-4 py-4 md:px-0 md:py-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {accommodationTypes
          .filter((type) => type.modes.includes(listingMode))
          .map((type, index) => (
          <button
            key={type.id}
            onClick={() => handleTypeClick(type.id)}
            className="group flex min-h-[7.75rem] flex-col items-center justify-center gap-2.5 rounded-xl bg-card/80 p-3 transition-all duration-300 animate-slide-up hover:-translate-y-1 hover:bg-card hover:shadow-card active:scale-[0.98] md:min-h-[9rem] md:p-4"
            style={{ animationDelay: `${index * 35}ms` }}
          >
            <div
              className={cn(
                "flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 md:h-24 md:w-24",
                type.tint,
              )}
            >
              <img
                src={type.image}
                alt=""
                className="h-16 w-16 object-contain drop-shadow-sm transition-transform duration-300 group-hover:-rotate-3 md:h-20 md:w-20"
                loading="lazy"
              />
            </div>
            <span className="min-h-8 px-1 text-center text-xs font-semibold leading-tight text-foreground/90 md:text-sm">
              {type.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AccommodationTypes;
