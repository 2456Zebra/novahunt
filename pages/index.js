import Image from "next/image";
import { useState } from "react";
import CompanySearch from "@/components/CompanySearch";
import SearchResults from "@/components/SearchResults";

const companies = {
  "coca-cola.com": { name: "The Coca-Cola Company", logo: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Coca-Cola_logo.svg", founded: "1892", location: "Atlanta, Georgia", size: "10,001+ employees", industry: "Food & Beverages", narrative: "Fizzing since 1886. Secret formula in a vault. Polar bears love it. Legends." },
  "fordmodels.com": { name: "Ford Models", logo: "https://via.placeholder.com/160?text=Ford", founded: "1946", location: "New York, NY", size: "51–200 employees", industry: "Modeling", narrative: "Discovered supermodels before “supermodel” was a word." },
  "unitedtalent.com": { name: "United Talent Agency", logo: "https://via.placeholder.com/160?text=UTA", founded: "1991", location: "Beverly Hills, CA", size: "1,001–5,000 employees", industry: "Entertainment", narrative: "They rep the people who play make-believe for a living." },
  "wilhelmina.com": { name: "Wilhelmina Models", logo: "https://via.placeholder.com/160?text=Wilhelmina", founded: "1967", location: "New York, NY", size: "201–500 employees", industry: "Fashion", narrative: "Home of the original supermodels." },
  "nfl.com": { name: "National Football League", logo: "https://upload.wikimedia.org/wikipedia/en/a/a2/National_Football_League_logo.svg", founded: "1920", location: "New York, NY", size: "1,001–5,000 employees", industry: "Sports", narrative: "Where grown men chase a ball for billions on Sundays." }
};

const results = [
  { first_name: "John", last_name: "Smith", email: "john.smith@coca-cola.com", position: "VP Marketing", department: "Marketing" },
  { first_name: "Sarah", last_name: "Connor", email: "sarah.connor@coca-cola.com", position: "Director of Sales", department: "Sales" },
  { first_name: "Mike", last_name: "Chen", email: "mike.chen@coca-cola.com", position: "Head of Design", department: "Creative" }
];

export default function Home() {
  const [company, setCompany] = useState(null);

  return (
    <main className="min-h-screen px-8 py-12 max-w-screen-2xl mx-auto bg-gray-50">
      <div className="flex items-start justify-between mb-12">
        <Image src="/novahunt-logo.svg" alt="NovaHunt" width={280} height={80} priority />
        <nav className="flex items-center gap-8 text-sm font-medium">
          <a href="/" className="hover:underline underline-offset-4">Home</a>
          <a href="/plans" className="hover:underline underline-offset-4">Plans</a>
          <a href="/about" className="hover:underline underline-offset-4">About</a>
          <a href="/signin" className="hover:underline underline-offset-4">Sign In</a>
          <a href="/signup" className="text-blue-600 font-semibold hover:underline underline-offset-4">Sign Up</a>
        </nav>
      </div>

      <div className="flex gap-10">
        <div className="w-96">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-7">
            <h3 className="text-lg font-semibold mb-5">Find business emails</h3>
            <CompanySearch />
          </div>
        </div>

        <div className="flex-1">
          {company ? (
            <>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 px-10 py-8 flex items-center justify-between">
                  <h1 className="text-4xl font-bold">{company.name}</h1>
                  <Image src={company.logo} alt="" width={160} height={160} className="rounded-2xl shadow-lg -mt-24" />
                </div>
                <div className="p-10 space-y-8">
                  <dl className="grid grid-cols-2 gap-6 text-sm">
                    <div><dt className="text-gray-600 font-medium">Founded</dt><dd className="font-semibold">{company.founded}</dd></div>
                    <div><dt className="text-gray-600 font-medium">Location</dt><dd className="font-semibold">{company.location}</dd></div>
                    <div><dt className="text-gray-600 font-medium">Size</dt><dd className="font-semibold">{company.size}</dd></div>
                    <div><dt className="text-gray-600 font-medium">Industry</dt><dd className="font-semibold">{company.industry}</dd></div>
                  </dl>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
                    <p className="text-lg italic leading-relaxed text-gray-700">{company.narrative}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-4">Take it for a test ride?</p>
                    <div className="flex flex-wrap gap-3">
                      {Object.keys(companies).map(d => (
                        <button key={d} onClick={() => setCompany(companies[d])} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition">
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 -mx-10">
                <SearchResults results={results} />
              </div>
            </>
          ) : (
            <div className="text-center py-40 text-2xl text-gray-400">
              Click any test domain to see the magic
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
