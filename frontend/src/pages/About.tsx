
const About = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative py-20 md:py-24 flex items-center"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.6)), url('https://images.unsplash.com/photo-1589308078059-be1415eab4c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container">
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4">
              About Gaun Basti
            </h1>
            <p className="text-xl md:text-2xl opacity-90">
              Connecting travelers with authentic Nepali homestay experiences
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-serif font-semibold mb-6">Our Story</h2>
              <p className="text-lg mb-4">
                Gaun Basti was founded in 2020 with a simple mission: to connect travelers with authentic Nepali homestay experiences while supporting local communities.
              </p>
              <p className="text-lg mb-4">
                Our founders, having grown up in the beautiful villages of Nepal, recognized the unique opportunity to share the rich cultural heritage of rural Nepal with visitors from around the world.
              </p>
              <p className="text-lg">
                What started as a small initiative with just five homestays has now grown into a community of over 100 hosts across Nepal, each offering a unique glimpse into local life and traditions.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1583309219338-a582f1f9ca6d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2196&q=80"
                alt="Traditional Nepali home"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-16 bg-gaun-cream">
        <div className="container">
          <h2 className="text-3xl font-serif font-semibold mb-12 text-center">Our Mission</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="h-12 w-12 bg-gaun-green/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gaun-green"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Community Support</h3>
              <p className="text-muted-foreground">
                We provide economic opportunities for rural communities by connecting them with travelers, ensuring that tourism benefits go directly to local families.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="h-12 w-12 bg-gaun-green/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gaun-green"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M12 18v-6"></path><path d="M8 18v-1"></path><path d="M16 18v-3"></path></svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Cultural Preservation</h3>
              <p className="text-muted-foreground">
                We help preserve and promote Nepali traditions, architecture, and lifestyle by creating sustainable tourism that values cultural heritage.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="h-12 w-12 bg-gaun-green/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gaun-green"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Authentic Connections</h3>
              <p className="text-muted-foreground">
                We facilitate meaningful interactions between travelers and locals, creating rich cultural exchanges and unforgettable experiences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-white">
        <div className="container">
          <h2 className="text-3xl font-serif font-semibold mb-12 text-center">Meet Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Team Member 1 */}
            <div className="text-center">
              <div className="mb-4 rounded-full overflow-hidden mx-auto w-40 h-40">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80"
                  alt="Raj Sharma"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-medium">Raj Sharma</h3>
              <p className="text-gaun-green">Co-founder & CEO</p>
            </div>
            {/* Team Member 2 */}
            <div className="text-center">
              <div className="mb-4 rounded-full overflow-hidden mx-auto w-40 h-40">
                <img
                  src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80"
                  alt="Maya Gurung"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-medium">Maya Gurung</h3>
              <p className="text-gaun-green">Co-founder & COO</p>
            </div>
            {/* Team Member 3 */}
            <div className="text-center">
              <div className="mb-4 rounded-full overflow-hidden mx-auto w-40 h-40">
                <img
                  src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80"
                  alt="Sunil Thapa"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-medium">Sunil Thapa</h3>
              <p className="text-gaun-green">Technical Lead</p>
            </div>
            {/* Team Member 4 */}
            <div className="text-center">
              <div className="mb-4 rounded-full overflow-hidden mx-auto w-40 h-40">
                <img
                  src="https://images.unsplash.com/photo-1548142813-c348350df52b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80"
                  alt="Puja Tamang"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-medium">Puja Tamang</h3>
              <p className="text-gaun-green">Community Manager</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gaun-green text-white">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-3xl font-serif font-semibold mb-2">Join our community</h2>
              <p className="text-white/80">Become a host or start your adventure today</p>
            </div>
            <div className="flex gap-4">
              <a 
                href="/contact" 
                className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md shadow-sm text-gaun-green bg-white hover:bg-gaun-cream transition-colors"
              >
                Become a Host
              </a>
              <a 
                href="/listings" 
                className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md shadow-sm bg-transparent hover:bg-white/10 transition-colors"
              >
                Browse Homestays
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
