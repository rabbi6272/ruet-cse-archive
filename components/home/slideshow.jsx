// "use client";

// import { Splide, SplideSlide } from "@splidejs/react-splide";
// import "@splidejs/splide/css/skyblue";

// import image0 from "@/public/images/slideshow/image0.jpg";
// import Image from "next/image";

// const slides = [{ src: image0 }];

// export function Slideshow() {

//   return (
//     <div className="w-full h-auto">
//       <Splide
//         options={{
//           type: "loop",
//           autoplay: true,
//           interval: 3000,
//           arrows: false,
//           pagination: true,
//           pauseOnHover: false,
//           speed: 800,
//         }}
//         className="w-full mx-auto h-full "
//       >
//         {slides.map((item, index) => (
//           <SplideSlide
//             key={index}
//             className="h-full w-full md:w-[80%] lg:w-[60%] pb-8"
//           >
//             <Image
//               src={item.src}
//               alt={`Slide ${index + 1}`}
//               className="w-full md:w-[80%] lg:w-[60%] object-cover mx-auto"
//             />
//           </SplideSlide>
//         ))}
//       </Splide>
//     </div>
//   );
// }
