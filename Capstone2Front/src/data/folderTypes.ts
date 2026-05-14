export type FolderRecord = {

  id: string;

  name: string;

  /** ISO 8601 */

  createdAt: string;

};



/** 문서에서 삭제해 휴지통으로 보낸 폴더 */

export type TrashedFolderRecord = FolderRecord & {

  deletedAt: string;

};


