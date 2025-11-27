import Image from "next/image";
import { useState } from "react";

const companies = {
  "coca-cola.com": {
    name: "The Coca-Cola Company",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Coca-Cola_logo.svg/1024px-Coca-Cola_logo.svg.png",
    founded: "1892",
    location: "Atlanta, Georgia",
    size: "10,001+ employees",
    industry: "Food & Beverages",
    narrative: "Fizzing since 1886. Secret formula in a vault. Polar bears love it. Legends."
  },
  "fordmodels.com": {
    name: "Ford Models",
    logo: "https://via.placeholder.com/140x140?text=Ford",
    founded: "1946",
    location: "New York, NY",
    size: "51–200 employees",
    industry: "Modeling & Talent",
    narrative: "Discovered supermodels before “supermodel” was a word. Cheekbones that cut glass."
  },
  "unitedtalent.com": {
    name: "United Talent Agency",
    logo: "https://via.placeholder.com/140x140?text=UTA",
    founded: "1991",
    location: "Beverly Hills, CA",
    size: "1,001–5,000 employees",
    industry: "Entertainment",
    narrative: "Rep the make-believe pros who earn more than the fantasy. Power moves only."
  },
  "wilhelmina.com": {
    name: "Wilhelmina Models",
    logo: "https://via.placeholder.com/140x140?text=Wilhelmina",
    founded: "1967",
    location: "New York, NY",
    size: "201–500 employees",
    industry: "Fashion & Beauty",
    narrative: "Original supermodel home. Turned 'the look' into '90s Bitcoin."
  },
  "nfl.com": {
    name: "National Football League",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/National_Football_League_logo.svg/1200px-National_Football_League_logo.svg.png",
    founded: "1920",
    location: "New York, NY",
    size: "1,001–5,000 employees",
    industry: "Sports",
    narrative: "Grown men in tight pants chase a ball for billions. Sundays = arguments."
  }
};

const mockResults = [
  {
    first_name: "John",
    last_name: "Smith",
    email: "john.smith@coca-cola.com",
    position: "VP Marketing",
    department: "Marketing"
  },
  {
    first_name: "Sarah",
    last_name: "Connor",
    email: "sarah.connor@coca-cola.com",
    position: "Director of Sales",
    department: "Sales"
  },
  {
    first_name: "Mike",
    last_name: "Chen",
    email: "mike.chen@coca-cola.com",
    position: "Head of Design",
    department: "Creative"
  }
];

export default function Home() {
  const [company, setCompany] = useState(null);

  const loadCompany = (domain) => {
    setCompany(companies[domain]);
  };

  return (
    <>
      {/* Header: Point 1-2, 7: Nav in vacated top-right, logo aligned/unchanged */}
      <div className="flex items-start justify-between mb-12">
        <Image src="/novahunt-logo.svg" alt="NovaHunt" width={280} height={80} className="select-none" priority />
        <nav className="flex items-center gap-8 text-sm font-medium">
          <a href="/" className="hover:underline underline-offset-4">Home</a>
          <a href="/plans" className="hover:underline underline-offset-4">Plans</a>
          <a href="/about" className="hover:underline underline-offset-4">About</a>
          <a href="/signin" className="hover:underline underline-offset-4">Sign In</a>
          <a href="/signup" className="text-blue-600 font-semibold hover:underline underline-offset-4">Sign Up</a>
        </nav>
      </div>

      <div className="flex gap-10">
        {/* Point 8-9: Left sidebar unchanged */}
        <div className="w-96">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-7">
            <h3 className="text-lg font-semibold mb-5">Find business emails</h3>
            <input type="text" placeholder="Enter company domain (e.g. coca-cola.com)" className="w-full px-6 py-4 text-lg rounded-xl border border-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-500/30" />
          </div>
        </div>

        <div className="flex-1">
          {company ? (
            <>
              {/* Company card: Points 1, 3-6 */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 px-10 py-8 flex items-center justify-between">
                  <h1 className="text-4xl font-bold">{company.name}</h1>
                  <Image src={company.logo} alt="" width={160} height={160} className="rounded-2xl shadow-lg -mt-24" />
                </div>
                <div className="p-10 space-y-8">
                  {/* Point 5: Bullet facts */}
                  <dl className="grid grid-cols-2 gap-6 text-sm">
                    <div><dt className="text-gray-600 font-medium">Founded</dt><dd className="font-semibold">{company.founded}</dd></div>
                    <div><dt className="text-gray-600 font-medium">Location</dt><dd className="font-semibold">{company.location}</dd></div>
                    <div><dt className="text-gray-600 font-medium">Size</dt><dd className="font-semibold">{company.size}</dd></div>
                    <div><dt className="text-gray-600 font-medium">Industry</dt><dd className="font-semibold">{company.industry}</dd></div>
                  </dl>
                  {/* Point 6: Decorative narrative */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
                    <p className="text-lg italic leading-relaxed text-gray-700">{company.narrative}</p>
                  </div>
                  {/* Point 10: Test ride */}
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-4">Take it for a test ride?</p>
                    <div className="flex flex-wrap gap-3">
                      {Object.keys(companies).map(d => (
                        <button key={d} onClick={() => loadCompany(d)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition">
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Points 11, 13-17: Full-width results, vertical list, grouped, monospace italic, Source, Reveal right */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 -mx-10">
                <div className="space-y-10">
                  {Object.entries(mockResults.reduce((acc, r) => {
                    (acc[r.department] ||= []).push(r);
                    return acc;
                  }, {})).map(([dept, items]) => (
                    <div key={dept}>
                      <h3 className="text-xl font-bold mb-5 flex items-center gap-3">
                        <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                        {dept} <span className="text-gray-500 font-normal">({items.length})</span>
                      </h3>
                      <div className="space-y-4">
                        {items.map(r => (
                          <div key={r.email} className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                            <div className="font-mono italic text-sm text-gray-700">
                              {r.email.replace(/^.{4}/, "••••")} <span className="ml-4 text-gray-500">• {r.position}</span>
                            </div>
                            <div className="flex gap-4">
                              <button onClick={() => window.open(`https://www.google.com/search?q=site:linkedin.com/in+${r.first_name}+${r.last_name}`, "_blank")} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition">
                                Source
                              </button>
                              <button className="px-4 py-2 text-blue-600 font-medium text-sm hover:underline">Reveal</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-40 text-2xl text-gray-400">
              Click any test domain to see the magic
            </div>
          )}
        </div>
      </div>
    </>
  );
}
