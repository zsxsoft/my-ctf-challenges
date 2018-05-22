(ns not-js.part2
  (:require
   [not-js.common :as common]))

(defn check [n] (= 0 (compare [45, 36, 57, 36, 54, 38, 53, 1, 51, 55] (common/stringToInt n))))
