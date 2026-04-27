import { apiSlice } from "../apiSlice";
import type { EndpointBuilder } from "@reduxjs/toolkit/query";

export const coursesApi = apiSlice.injectEndpoints({
  endpoints: (builder: EndpointBuilder<any, "Courses", "api">) => ({
    // Fetch all courses
    getCourses: builder.query({
      query: () => "/get-courses",
      providesTags: ["Courses"],
    }),
    // Fetch bestseller courses
    getBestsellers: builder.query({
      query: () => "/get-bestsellers",
    }),
    // Fetch course details by slug
    getCourseDetails: builder.query({
      query: (slug: string) => `/get-course/${slug}`,
    }),
  }),
});

export const { 
  useGetCoursesQuery, 
  useGetBestsellersQuery, 
  useGetCourseDetailsQuery 
} = coursesApi;