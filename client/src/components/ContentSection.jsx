import React from "react";
import ContentText from "./ContentText";
import SkeletonLoader from "./SkeletonLoader";
import MediaDisplay from "./MediaDisplay";

const ContentSection = ({
  staticContent,
  content,
  isLoading,
  bottomMarginCondition = null,
  additionalBottomMargin = false,
  alwaysShowFinalHr = false
}) => {
  return (
    <div>
      {staticContent.map((item, index) => {
        const isLastItem = index === staticContent.length - 1;
        const isNextTextArray = !isLastItem && Array.isArray(staticContent[index + 1].text);
        const showHr = !isLastItem && (!Array.isArray(item.text) || !isNextTextArray);
        const addBottomMargin = bottomMarginCondition ? item.id === bottomMarginCondition : false;

        return (
          <article key={item.id}>
            <ContentText title={item.title} text={item.text} />
            {isLoading ? (
              <SkeletonLoader />
            ) : (
              <MediaDisplay
                images={content.find((data) => data.id === item.id)?.images || []}
                addBottomMargin={addBottomMargin}
              />
            )}
            {showHr && !isLastItem ? (
              <hr />
            ) : null}
            {additionalBottomMargin && addBottomMargin && <div className="bottom-margin" />}
          </article>
        );
      })}
      {alwaysShowFinalHr && <hr />}
    </div>
  );
};

export default ContentSection;
