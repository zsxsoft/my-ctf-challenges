(ns not-js.part6
  (:require
   [clojure.string :as str]
   [not-js.common :as common]))
(defprotocol Queue
  (put! [q item] "put an item into the queue")
  (take! [q] "take an item from the queue")
  (length! [q] "get length")
  (shutdown! [q] "stop accepting puts in the queue"))
(deftype UnboundedQueue [^:mutable arr ^:mutable closed]
  Queue
  (put! [_ item]
    (assert (not closed))
    (assert (not (nil? item)))
    (.push arr item)
    item)
  (take! [_]
    (aget (.splice arr 0 1) 0))
  (length! [_]
    (.-length arr))
  (shutdown! [_]
    (set! closed true)))

(defn unbounded-queue
  ([]
   (unbounded-queue nil))
  ([xform]
   (let [put! (completing put!)
         xput! (if xform (xform put!) put!)
         q (UnboundedQueue. #js [] false)]
     (reify
       Queue
       (put! [_ item]
         (when-not (.-closed q)
           (let [val (xput! q item)]
             (if (reduced? val)
               (do
                 (xput! @val)  ;; call completion step
                 (shutdown! q) ;; respect reduced
                 @val)
               val))))
       (take! [_]
         (take! q))
       (length! [_]
         (length! q))
       (shutdown! [_]
         (shutdown! q))))))

(defn check [inp]
  (def xq (unbounded-queue (comp
    (take-while #(not= % 12))
    (partition-all 2))))
  (mapv #(put! xq %1) (common/stringToInt inp))
  (if (=
    (compare
      [21104, 50328, 78128, 119488, 411168, 592832] (((fn [f]
      ((fn [x] (x x))
       (fn [x]
        (f (fn [y z] ((x x) y z))))))
        (fn [func]
          (fn [ret x]
            (if (zero? x)
              []
              (conj
                (func ret (dec x))
                (bit-shift-left
                  (let
                    [n (take! xq)]
                    (((fn [f]
                        ((fn [x]
                          (x x))
                        (fn [x]
                          (f (fn [y z]
                                ((x x) y z))))))
                      (fn [func]
                        (fn [ret x]
                          (if (= x -1)
                            0
                            (+ (bit-shift-left (func ret (dec x)) 8) (get n x)))))) 0 (- (count n) 1))
                    )
                x))
            )))) [] (length! xq))) 0) true false)
)
