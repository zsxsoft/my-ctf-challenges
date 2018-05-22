(ns not-js.core
  (:require
   goog.object
   cljsjs.semantic-ui-react
   [reagent.core :as r]
   [cljsjs.react-draggable :as draggable]
   [clojure.string :as str]
   [not-js.part1 :as part1]
   [not-js.part2 :as part2]
   [not-js.part3 :as part3]
   [not-js.part4 :as part4]
   [not-js.part5 :as part5]
   [not-js.part6 :as part6]
   [not-js.part7 :as part7]))
(enable-console-print!)
(def parts [part1/check part2/check part3/check part4/check part5/check part6/check part7/check])
(def draggable (r/adapt-react-class js/ReactDraggable))
(def semantic-ui js/semanticUIReact)

(def button (goog.object/get semantic-ui "Button"))
(def input (goog.object/get semantic-ui "Input"))
(def modal (goog.object/get semantic-ui "Modal"))
(defn get-modal-object [val] (goog.object/getValueByKeys semantic-ui "Modal" val))
(def modal-header (get-modal-object "Header"))
(def modal-content (get-modal-object "Content"))
(def modal-description (get-modal-object "Description"))
(def modal-actions (get-modal-object "Actions"))
(defn verify [s]
  (def w (str/split s "_"))
  (if (= (count w) (count parts))
    (= (count (filterv true? (mapv #(apply (val %) [(key %)]) (zipmap w parts)))) (count parts))
    false))

(defn atom-input [value]
  [:> input {:type "text"
             :style {:width "100%"}
             :value @value
             :placeholder "Input password"
             :on-change #(reset! value (-> % .-target .-value))}])

(defn home-page []
  (let
   [val (r/atom "")
    verifying (r/atom false)
    verified (r/atom false)
    submitted (r/atom false)]
    (fn []
      [:div {:class "container"}
       [:div {:class (str "background " (if @verified "background-b" "background-a"))}
        [:img {:src (str "images/" (if @verified "FGKG09C" "FGKG09B") ".jpg")}]]
       [:div {:class "absolute-center"}
        (if (not (or @verified @verifying))
          [:> button {:onClick #(reset! verifying true)
                      :positive true}
           "Enter Password"])
        (if @verified
          [:div {:style {:color "white"
                         :fontSize "3em"
                         :textAlign "center"
                         :textShadow "0px 2px 15px green"}}
           [:p "Flag correct!"]
           [:p (str "RCTF{" @val "}")]])]

       (if (and @verifying (not @verified))
         [:> modal {:dimmer "blurring" :open @verifying}
          [:> modal-header "Input"]
          [:> modal-content
           (if @submitted
             (if (not @verified)
               [:p {:style {:color "red" :textAlign "center"}}
                "Flag incorrect"]))
           [atom-input val]]
          [:> modal-actions
           [:> button {:onClick #(do
                                   (if
                                    (verify @val)
                                     (reset! verified true))
                                   (reset! submitted true)
                                   (js/setTimeout (fn [] (reset! submitted false)) 5000))
                       :positive true}
            "Verify"]]])])))

(defn mount-root []
  (r/render [home-page] (.getElementById js/document "app")))

(def cursor (.querySelector js/document ".cursor"))
(defn mouse-move [e]
  (set! (.-transform (.-style cursor)) (str "translateX(" (.-clientX e) "px) translateY(" (.-clientY e) "px)")))

(defn init! []
  (mount-root)
  (js/document.addEventListener "mousemove" mouse-move))
