/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CommentSection, CommentSectionProps } from './CommentSection';

export const CommentsSheetModal: React.FC<CommentSectionProps> = (props) => {
  return <CommentSection {...props} />;
};

export { CommentSection };
