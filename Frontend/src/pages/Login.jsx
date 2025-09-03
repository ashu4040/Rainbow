import React from "react";
import { assets } from "../assets/assets";
import { Heart, Star } from "lucide-react";
import { SignIn } from "@clerk/clerk-react";

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/*  background img */}
      <img
        src={assets.bgImage}
        alt=""
        className="absolute top-0 left-0 -z-1 w-full h-full object-cover"
      />

      {/* left side: Branding */}
      <div className="flex-1 flex flex-col items-start justify-between p-6 md:p-10 lg:pl-40">
        <div className="flex items-center justify-center gap-2">
          <img
            src={assets.icon}
            alt=""
            className="h-12 md:h-20 object-contain"
          />
          <h1 className=" w-80 text-2xl md:text-4xl flex items-center text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 font-bold">
            RAINBOW
          </h1>
        </div>
        <div>
          <div className="flex items-center gap-3 mb-4 max-md:mt-10">
            <img src={assets.group} alt="" className="h-10 md:h-18" />
            <div>
              <div className="flex space-x-0.5">
                {[
                  "text-red-500",
                  "text-orange-500",
                  "text-yellow-500",
                  "text-green-500",
                  "text-blue-500",
                ].map((color, i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 md:w-6 md:h-7 ${color} fill-current`}
                  />
                ))}
              </div>

              <p className="font-semibold">Be Proud Of Yourself </p>
            </div>
          </div>
          <h1 className="text-3xl md:text-6xl md:pb-2 font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
            Celebrate Diversity Together
          </h1>
          <p className="text-xl md:text-3xl text-pink-600 max-w-72 md:max-w-md">
            Connect Them Globally
          </p>
        </div>
        <span className="md:h-10"></span>
      </div>
      {/* right side login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <SignIn />
      </div>
    </div>
  );
};

export default Login;
