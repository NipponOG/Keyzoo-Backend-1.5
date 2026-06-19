import type { Schema, Struct } from '@strapi/strapi';

export interface BlogContent extends Struct.ComponentSchema {
  collectionName: 'components_blog_contents';
  info: {
    displayName: 'Content';
  };
  attributes: {
    description: Schema.Attribute.RichText;
    image: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String;
  };
}

export interface BlogHeading extends Struct.ComponentSchema {
  collectionName: 'components_blog_headings';
  info: {
    displayName: 'Heading';
  };
  attributes: {
    title: Schema.Attribute.String;
  };
}

export interface BlogImage extends Struct.ComponentSchema {
  collectionName: 'components_blog_images';
  info: {
    displayName: 'Image';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
  };
}

export interface BlogStep extends Struct.ComponentSchema {
  collectionName: 'components_blog_steps';
  info: {
    displayName: 'Step';
  };
  attributes: {
    description: Schema.Attribute.RichText;
    image: Schema.Attribute.Media<'images'>;
    step: Schema.Attribute.Integer;
  };
}

export interface GameLanguageAudioLanguage extends Struct.ComponentSchema {
  collectionName: 'components_game_language_audio_languages';
  info: {
    displayName: 'Audio Language';
  };
  attributes: {
    audio: Schema.Attribute.String;
  };
}

export interface GameLanguageInterfaceLanguage extends Struct.ComponentSchema {
  collectionName: 'components_game_language_interface_languages';
  info: {
    displayName: 'Interface Language';
  };
  attributes: {
    interface: Schema.Attribute.Text;
  };
}

export interface GameLanguageLanguageSupport extends Struct.ComponentSchema {
  collectionName: 'components_game_language_language_supports';
  info: {
    displayName: 'Language Support';
  };
  attributes: {};
}

export interface GameLanguageSubtitlesLanguage extends Struct.ComponentSchema {
  collectionName: 'components_game_language_subtitles_languages';
  info: {
    displayName: 'Subtitles Language';
  };
  attributes: {
    subtitles: Schema.Attribute.Text;
  };
}

export interface GameRequirementsMinimum extends Struct.ComponentSchema {
  collectionName: 'components_game_requirements_minimums';
  info: {
    description: 'Minimum system requirements for a game';
    displayName: 'Minimum Requirement';
  };
  attributes: {
    additional_notes: Schema.Attribute.String;
    graphics: Schema.Attribute.String;
    memory: Schema.Attribute.String;
    os: Schema.Attribute.String;
    processor: Schema.Attribute.String;
    sound: Schema.Attribute.String;
    storage: Schema.Attribute.String;
  };
}

export interface GameRequirementsRecommended extends Struct.ComponentSchema {
  collectionName: 'components_game_requirements_recommendeds';
  info: {
    description: 'Recommended system requirements for a game';
    displayName: 'Recommended Requirement';
  };
  attributes: {
    additional_notes: Schema.Attribute.String;
    graphics: Schema.Attribute.String;
    memory: Schema.Attribute.String;
    os: Schema.Attribute.String;
    processor: Schema.Attribute.String;
    sound: Schema.Attribute.String;
    storage: Schema.Attribute.String;
  };
}

export interface SharedMetaSocial extends Struct.ComponentSchema {
  collectionName: 'components_shared_meta_socials';
  info: {
    displayName: 'Meta Social';
  };
  attributes: {
    description: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    socialNetwork: Schema.Attribute.Enumeration<
      ['Facebook', 'Twitter', 'Discord', 'WhatsApp', 'LinkedIn']
    >;
    title: Schema.Attribute.String;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    displayName: 'SEO';
    icon: 'globe';
  };
  attributes: {
    canonicalURL: Schema.Attribute.String;
    keywords: Schema.Attribute.Text;
    metaDescription: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    metaImage: Schema.Attribute.Media<'images'>;
    metaRobots: Schema.Attribute.Enumeration<
      ['index,follow', 'noindex,follow', 'index,nofollow', 'noindex,nofollow']
    >;
    metaSocial: Schema.Attribute.Component<'shared.meta-social', true>;
    metaTitle: Schema.Attribute.String;
    structuredData: Schema.Attribute.JSON;
  };
}

export interface SlugSeoTagTag extends Struct.ComponentSchema {
  collectionName: 'components_slug_seo_tag_tags';
  info: {
    displayName: 'Tag';
  };
  attributes: {
    gametag_1: Schema.Attribute.String;
    gametag_10: Schema.Attribute.String;
    gametag_2: Schema.Attribute.String;
    gametag_3: Schema.Attribute.String;
    gametag_4: Schema.Attribute.String;
    gametag_5: Schema.Attribute.String;
    gametag_6: Schema.Attribute.String;
    gametag_7: Schema.Attribute.String;
    gametag_8: Schema.Attribute.String;
    gametag_9: Schema.Attribute.String;
  };
}

export interface TagsTag extends Struct.ComponentSchema {
  collectionName: 'components_tags_tags';
  info: {
    displayName: 'Tag';
    icon: 'hashtag';
  };
  attributes: {
    Tags: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'blog.content': BlogContent;
      'blog.heading': BlogHeading;
      'blog.image': BlogImage;
      'blog.step': BlogStep;
      'game-language.audio-language': GameLanguageAudioLanguage;
      'game-language.interface-language': GameLanguageInterfaceLanguage;
      'game-language.language-support': GameLanguageLanguageSupport;
      'game-language.subtitles-language': GameLanguageSubtitlesLanguage;
      'game-requirements.minimum': GameRequirementsMinimum;
      'game-requirements.recommended': GameRequirementsRecommended;
      'shared.meta-social': SharedMetaSocial;
      'shared.seo': SharedSeo;
      'slug-seo-tag.tag': SlugSeoTagTag;
      'tags.tag': TagsTag;
    }
  }
}
