(ns not-js.common
  (:require [clojure.string :as str]))

(defn stringToInt [s]
  (mapv
   (fn [s]
     (let [w (.charCodeAt s)]
       (cond
         (<= w 57) (- w 48)
         (<= w 90) (+ (- w 65) 10)
         (<= w 122) (+ (- w 97) 36))))
   (.split s "")))

(defn b2h [s]
  (js/window.btoa
   (str/join
    ""
    (mapv
     js/String.fromCharCode
     (stringToInt s)))))

(defn base32 [inp]
  (defn char-range [start end] (map char (range (int start) (inc (int end)))))
  (def modified-base32
    (let [alphabet (str/join (apply conj (char-range 65 90) (vec (char-range 50 55))))
          ; this is not real base32-alphabet, the commented is.
          ; alphabet (str/join (apply conj (char-range 50 55) (rseq (vec (char-range 65 90)))))
          leftover (mod (.-length inp) 5)]
      (def s (str inp (.repeat (js/String.fromCharCode 0) (- 5 leftover)) ""))
      (def rep
        (cond
          (= leftover 1) 6
          (= leftover 2) 4
          (= leftover 3) 3
          (= leftover 4) 1
          :else 0))
      (def c (mapv #(.charCodeAt %1) (str/split s "")))
      (def w
        (pop
         (mapv
          #(aget alphabet %1)
          (loop [i 0 ret []]
            (if (< i (long (/ (.-length s) 5)))
              (recur
               (inc i)
               (conj
                ret
                (bit-shift-right (get c (* i 5)) 3)
                (bit-or (bit-shift-left (bit-and (get c (* i 5)) 0x07) 2) (bit-shift-right (get c (+ (* i 5) 1)) 6))
                (bit-shift-right (bit-and (get c (+ (* i 5) 1)) 0x3F) 1)
                (bit-or (bit-shift-left (bit-and (get c (+ (* i 5) 1)) 0x01) 4) (bit-shift-right (get c (+ (* i 5) 2)) 4))
                (bit-or (bit-shift-left (bit-and (get c (+ (* i 5) 2)) 0x0F) 1) (bit-shift-right (get c (+ (* i 5) 3)) 7))
                (bit-shift-right (bit-and (get c (+ (* i 5) 3)) 0x7F) 2)
                (bit-or (bit-shift-left (bit-and (get c (+ (* i 5) 3)) 0x03) 3) (bit-shift-right (get c (+ (* i 5) 4)) 5))
                (bit-and (get c (+ (* i 5) 4)) 0x1F)))
              ret)))))
      (str/join
       ""
       (if
        (> rep 0)
         (apply
          assoc
          w
          (loop
           [i 0 ret []]
            (if
             (< i rep)
              (recur
               (inc i)
               (conj
                ret
                (- (count w) i)
              ; "=" is right
                "0"))
              ret)))
         (subvec w 0 (- (count w) 7))))))
  (str/join "" (rseq (str/split modified-base32 ""))))

