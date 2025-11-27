@@
         <div className="flex items-start justify-between mb-8">
           <Image
             src="/novahunt-logo.svg"
             alt="NovaHunt"
             width={280}
             height={80}
             className="select-none"
           />
-          <div className="flex items-center gap-4">
-            <Button variant="ghost" size="sm">Sign In</Button>
-            <Button size="sm">Get Started</Button>
-          </div>
+          {/* Vacated top-right area now used for nav links */}
+          <div className="flex items-center gap-8 text-sm font-medium">
+            <a href="/" className="hover:underline underline-offset-4">Home</a>
+            <a href="/plans" className="hover:underline underline-offset-4">Plans</a>
+            <a href="/about" className="hover:underline underline-offset-4">About</a>
+            <a href="/signin" className="hover:underline underline-offset-4">Sign In</a>
+            <a href="/signup" className="hover:underline underline-offset-4 textnova-500 font-semibold">Sign Up</a>
+          </div>
         </div>
 
         {/* Search Section */}
         <div className="flex gap-8">
           {/* Left Sidebar */}
           <div className="w-96 space-y-8">
             <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
               <h3 className="text-lg font-semibold mb-4">Find business emails</h3>
               <CompanySearch />
             </div>
           </div>
 
           {/* Right Panel - Company Card + Results */}
-          <div className="flex-1">
+          <div className="flex-1 max-w-5xl">
             {company ? (
               <div className="space-y-6">
                 {/* Company Header with Logo Aligned to NovaHunt Logo */}
                 <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                   <div className="bg-gradient-to-br from-gray-50 to-gray-100 px-8 py-6 flex items-center justify-between">
                     <div>
-                      <div className="flex items-center gap-3 mb-2">
-                        <Image src={company.logo} alt={company.name} width={40} height={40} className="rounded-lg" />
-                        <h2 className="text-2xl font-bold text-gray-900">Company</h2>
-                      </div>
+                      <h2 className="text-3xl font-bold text-gray-900">{company.name}</h2>
                     </div>
                     {/* Large company logo - moved down to align top with NovaHunt logo */}
                     <Image
                       src={company.logo || "/placeholder-logo.png"}
                       alt={company.name}
                       width={140}
                       height={140}
-                      className="rounded-xl shadow-md"
+                      className="rounded-xl shadow-md -mt-20 translate-y-8" // Dropped down precisely
                     />
                   </div>
 
                   <div className="p-8 space-y-6">
                     {/* Bullet Facts */}
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div>
                         <span className="font-medium text-gray-600">Founded</span>
                         <p className="font-semibold">{company.founded || "—"}</p>
                       </div>
                       <div>
                         <span className="font-medium text-gray-600">Location</span>
                         <p className="font-semibold">{company.location || "—"}</p>
                       </div>
                       <div>
                         <span className="font-medium text-gray-600">Employees</span>
                         <p className="font-semibold">{company.size || "—"}</p>
                       </div>
                       <div>
                         <span className="font-medium text-gray-600">Industry</span>
                         <p className="font-semibold">{company.industry || "—"}</p>
                       </div>
                     </div>
 
                     {/* Decorative Narrative */}
                     <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                       <p className="text-gray-700 leading-relaxed italic">
                         {company.narrative || `${company.name} is a leader in its industry, known for innovation, bold moves, and occasionally questionable decisions. They're probably hiring... or firing. Who knows anymore.`}
                       </p>
                     </div>
 
                     {/* Test Ride Section */}
                     <div className="mt-8">
                       <p className="text-sm font-medium text-gray-600 mb-3">Take it for a test ride?</p>
                       <div className="flex flex-wrap gap-3">
                         {["coca-cola.com", "fordmodels.com", "unitedtalent.com", "wilhelmina.com", "nfl.com"].map((domain) => (
                           <button
                             key={domain}
                             onClick={() => handleTestSearch(domain)}
                             className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                           >
                             {domain}
                           </button>
                         ))}
                       </div>
                     </div>
                   </div>
                 </div>
 
                 {/* Search Results - Full Width */}
-                <SearchResults results={results} />
+                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 -ml-8 -mr-8 -mb-8">
+                  <SearchResults results={results} />
+                </div>
               </div>
             ) : (
               <WelcomeMessage />
             )}
           </div>
         </div>
