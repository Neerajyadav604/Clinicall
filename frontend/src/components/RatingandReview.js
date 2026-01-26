import { useState } from "react";

const testimonials = [
  {
    name: "John Doe",
    role: "Entrepreneur",
    img: "https://i.pravatar.cc/100?img=1",
    text:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ipsam temporibud quiden magni."
  },
  {
    name: "Jane Smith",
    role: "Designer",
    img: "https://i.pravatar.cc/100?img=2",
    text:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Inventore nisi velit minima."
  },
  {
    name: "Alex Brown",
    role: "Developer",
    img: "https://i.pravatar.cc/100?img=3",
    text:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quasi natus inventore."
  }
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(1);

  const prevSlide = () => {
    setActiveIndex(
      activeIndex === 0 ? testimonials.length - 1 : activeIndex - 1
    );
  };

  const nextSlide = () => {
    setActiveIndex(
      activeIndex === testimonials.length - 1 ? 0 : activeIndex + 1
    );
  };

  return (
    <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="max-w-6xl mx-auto text-center px-4 sm:px-6">
        <p className="text-blue-500 text-xs sm:text-sm mb-2 font-medium">
          What our customers say about us
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-12 md:mb-16 text-gray-900">
          Testimonials
        </h2>

        <div className="relative flex items-center justify-center">
          <button
            onClick={prevSlide}
            className="absolute left-0 sm:left-4 md:left-0 text-2xl sm:text-3xl text-gray-400 hover:text-blue-500 z-20 bg-white sm:bg-transparent rounded-full w-8 h-8 sm:w-auto sm:h-auto flex items-center justify-center transition-colors"
          >
            ❮
          </button>

          <div className="flex gap-4 sm:gap-6 md:gap-8 overflow-hidden w-full justify-center">
            <div className="hidden md:flex gap-8">
              {testimonials.map((item, index) => {
                const isActive = index === activeIndex;

                return (
                  <div
                    key={index}
                    className={`w-80 bg-white rounded-xl p-8 shadow-xl transition-all duration-500
                      ${
                        isActive
                          ? "scale-100 opacity-100 z-10 border-2 border-blue-400"
                          : "scale-90 opacity-40 blur-sm"
                      }
                    `}
                  >
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-16 h-16 rounded-full mx-auto mb-4 border-2 border-blue-300"
                    />
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-blue-600">{item.role}</p>
                    <p className="mt-4 text-gray-600">{item.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="md:hidden w-full max-w-sm mx-auto px-8 sm:px-12">
              <div className="w-full bg-white rounded-xl p-6 sm:p-8 shadow-xl border-2 border-blue-400">
                <img
                  src={testimonials[activeIndex].img}
                  alt={testimonials[activeIndex].name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto mb-4 border-2 border-blue-300"
                />
                <h3 className="font-semibold text-base sm:text-lg text-gray-900">
                  {testimonials[activeIndex].name}
                </h3>
                <p className="text-xs sm:text-sm text-blue-600">
                  {testimonials[activeIndex].role}
                </p>
                <p className="mt-4 text-sm sm:text-base text-gray-600">
                  {testimonials[activeIndex].text}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={nextSlide}
            className="absolute right-0 sm:right-4 md:right-0 text-2xl sm:text-3xl text-gray-400 hover:text-blue-500 z-20 bg-white sm:bg-transparent rounded-full w-8 h-8 sm:w-auto sm:h-auto flex items-center justify-center transition-colors"
          >
            ❯
          </button>
        </div>

        <div className="flex justify-center mt-8 sm:mt-10 gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === activeIndex ? "bg-blue-500" : "bg-gray-300"
              }`}
            ></button>
          ))}
        </div>
      </div>
    </section>
  );
}