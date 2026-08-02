// Vikunja is a to-do list application to facilitate your life.
// Copyright 2018-present Vikunja and contributors. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

package models

import (
	"testing"

	"code.vikunja.io/api/pkg/db"
	"code.vikunja.io/api/pkg/user"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestProjectView_Update(t *testing.T) {
	u := &user.User{ID: 1}

	t.Run("switch list view to kanban seeds default buckets", func(t *testing.T) {
		db.LoadAndAssertFixtures(t)
		s := db.NewSession()
		defer s.Close()

		view := &ProjectView{
			ID:                      1,
			ProjectID:               1,
			Title:                   "List",
			ViewKind:                ProjectViewKindKanban,
			BucketConfigurationMode: BucketConfigurationModeNone,
		}
		err := view.Update(s, u)
		require.NoError(t, err)
		require.NoError(t, s.Commit())

		assert.Equal(t, BucketConfigurationModeManual, view.BucketConfigurationMode)
		db.AssertExists(t, "project_views", map[string]interface{}{
			"id":                        1,
			"view_kind":                 ProjectViewKindKanban,
			"bucket_configuration_mode": BucketConfigurationModeManual,
			"default_bucket_id":         view.DefaultBucketID,
			"done_bucket_id":            view.DoneBucketID,
		}, false)
		assert.NotZero(t, view.DefaultBucketID)
		assert.NotZero(t, view.DoneBucketID)

		s2 := db.NewSession()
		defer s2.Close()
		buckets := []*Bucket{}
		err = s2.Where("project_view_id = ?", view.ID).Find(&buckets)
		require.NoError(t, err)
		assert.Len(t, buckets, 3)

		taskCount, err := s2.Where("project_id = ?", view.ProjectID).Count(&Task{})
		require.NoError(t, err)
		taskBucketCount, err := s2.Where("project_view_id = ?", view.ID).Count(&TaskBucket{})
		require.NoError(t, err)
		assert.Equal(t, taskCount, taskBucketCount)
	})

	t.Run("switch list view to kanban with filter mode does not seed buckets", func(t *testing.T) {
		db.LoadAndAssertFixtures(t)
		s := db.NewSession()
		defer s.Close()

		view := &ProjectView{
			ID:                      1,
			ProjectID:               1,
			Title:                   "List",
			ViewKind:                ProjectViewKindKanban,
			BucketConfigurationMode: BucketConfigurationModeFilter,
			BucketConfiguration: []*ProjectViewBucketConfiguration{
				{Title: "Open", Filter: &TaskCollection{Filter: "done = false"}},
			},
		}
		err := view.Update(s, u)
		require.NoError(t, err)
		require.NoError(t, s.Commit())

		s2 := db.NewSession()
		defer s2.Close()
		bucketCount, err := s2.Where("project_view_id = ?", view.ID).Count(&Bucket{})
		require.NoError(t, err)
		assert.Zero(t, bucketCount)
	})

	t.Run("invalid bucket configuration filter is rejected", func(t *testing.T) {
		db.LoadAndAssertFixtures(t)
		s := db.NewSession()
		defer s.Close()

		view := &ProjectView{
			ID:                      1,
			ProjectID:               1,
			Title:                   "List",
			ViewKind:                ProjectViewKindKanban,
			BucketConfigurationMode: BucketConfigurationModeFilter,
			BucketConfiguration: []*ProjectViewBucketConfiguration{
				{Title: "Broken", Filter: &TaskCollection{Filter: "nonexistingfield = true"}},
			},
		}
		err := view.Update(s, u)
		require.Error(t, err)
	})

	t.Run("switch kanban view to list resets bucket configuration mode", func(t *testing.T) {
		db.LoadAndAssertFixtures(t)
		s := db.NewSession()
		defer s.Close()

		view := &ProjectView{
			ID:                      4,
			ProjectID:               1,
			Title:                   "Kanban",
			ViewKind:                ProjectViewKindList,
			BucketConfigurationMode: BucketConfigurationModeManual,
		}
		err := view.Update(s, u)
		require.NoError(t, err)
		require.NoError(t, s.Commit())

		db.AssertExists(t, "project_views", map[string]interface{}{
			"id":                        4,
			"view_kind":                 ProjectViewKindList,
			"bucket_configuration_mode": BucketConfigurationModeNone,
		}, false)
	})

	t.Run("kanban round-trip does not duplicate buckets", func(t *testing.T) {
		db.LoadAndAssertFixtures(t)
		s := db.NewSession()
		defer s.Close()

		view := &ProjectView{
			ID:        4,
			ProjectID: 1,
			Title:     "Kanban",
			ViewKind:  ProjectViewKindList,
		}
		err := view.Update(s, u)
		require.NoError(t, err)

		view.ViewKind = ProjectViewKindKanban
		view.BucketConfigurationMode = BucketConfigurationModeNone
		err = view.Update(s, u)
		require.NoError(t, err)
		require.NoError(t, s.Commit())

		s2 := db.NewSession()
		defer s2.Close()
		bucketCount, err := s2.Where("project_view_id = ?", view.ID).Count(&Bucket{})
		require.NoError(t, err)
		// View 4 has 3 buckets in the fixtures, they survive the round-trip
		assert.Equal(t, int64(3), bucketCount)
	})
}
